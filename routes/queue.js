const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { isAuthenticated, isStaff } = require('../middleware/auth');

// ============================================
// POST /api/queue/join — User joins a queue
// ============================================
router.post('/join', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;
        const { serviceId } = req.body;

        if (!serviceId) {
            return res.status(400).json({ success: false, message: 'Service ID is required' });
        }

        // Check if service exists and is active
        const [services] = await pool.query(
            'SELECT * FROM services WHERE id = ? AND is_active = TRUE', [serviceId]
        );
        if (services.length === 0) {
            return res.status(404).json({ success: false, message: 'Service not found or inactive' });
        }

        // Check if user already has an active token (waiting/called/serving)
        const [activeTokens] = await pool.query(
            `SELECT * FROM tokens WHERE user_id = ? AND status IN ('waiting', 'called', 'serving') AND DATE(created_at) = CURDATE()`,
            [userId]
        );
        if (activeTokens.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'You already have an active token',
                token: activeTokens[0]
            });
        }

        const service = services[0];

        // Generate token number: PREFIX-XXX (daily counter)
        const [countResult] = await pool.query(
            'SELECT COUNT(*) as count FROM tokens WHERE service_id = ? AND DATE(created_at) = CURDATE()',
            [serviceId]
        );
        const tokenNum = String(countResult[0].count + 1).padStart(3, '0');
        const tokenNumber = `${service.prefix}-${tokenNum}`;

        // Insert token
        const [result] = await pool.query(
            'INSERT INTO tokens (token_number, user_id, service_id, status) VALUES (?, ?, ?, ?)',
            [tokenNumber, userId, serviceId, 'waiting']
        );

        // Get position in queue
        const [position] = await pool.query(
            `SELECT COUNT(*) as position FROM tokens 
             WHERE service_id = ? AND status = 'waiting' AND DATE(created_at) = CURDATE() AND id <= ?`,
            [serviceId, result.insertId]
        );

        res.status(201).json({
            success: true,
            message: 'Token generated successfully',
            token: {
                id: result.insertId,
                token_number: tokenNumber,
                service_name: service.name,
                status: 'waiting',
                position: position[0].position
            }
        });

    } catch (error) {
        console.error('Join queue error:', error);
        res.status(500).json({ success: false, message: 'Failed to join queue' });
    }
});

// ============================================
// GET /api/queue/my-token — User's active token
// ============================================
router.get('/my-token', isAuthenticated, async (req, res) => {
    try {
        const userId = req.session.user.id;

        const [tokens] = await pool.query(
            `SELECT t.*, s.name as service_name, s.prefix 
             FROM tokens t 
             JOIN services s ON t.service_id = s.id 
             WHERE t.user_id = ? AND t.status IN ('waiting', 'called', 'serving') AND DATE(t.created_at) = CURDATE()
             ORDER BY t.created_at DESC LIMIT 1`,
            [userId]
        );

        if (tokens.length === 0) {
            return res.json({ success: true, token: null, message: 'No active token' });
        }

        const token = tokens[0];

        // Get position if waiting
        let position = 0;
        if (token.status === 'waiting') {
            const [pos] = await pool.query(
                `SELECT COUNT(*) as position FROM tokens 
                 WHERE service_id = ? AND status = 'waiting' AND DATE(created_at) = CURDATE() AND id < ?`,
                [token.service_id, token.id]
            );
            position = pos[0].position + 1;
        }

        // Get total waiting
        const [waitingCount] = await pool.query(
            `SELECT COUNT(*) as total FROM tokens WHERE service_id = ? AND status = 'waiting' AND DATE(created_at) = CURDATE()`,
            [token.service_id]
        );

        // Get currently serving token
        const [currentlyServing] = await pool.query(
            `SELECT token_number FROM tokens 
             WHERE service_id = ? AND status IN ('called', 'serving') AND DATE(created_at) = CURDATE()
             ORDER BY called_at DESC LIMIT 1`,
            [token.service_id]
        );

        res.json({
            success: true,
            token: {
                ...token,
                position,
                total_waiting: waitingCount[0].total,
                currently_serving: currentlyServing.length > 0 ? currentlyServing[0].token_number : 'None'
            }
        });

    } catch (error) {
        console.error('My token error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch token' });
    }
});

// ============================================
// GET /api/queue/status/:serviceId — Queue status for a service
// ============================================
router.get('/status/:serviceId', async (req, res) => {
    try {
        const { serviceId } = req.params;

        // Get all tokens for today for this service
        const [tokens] = await pool.query(
            `SELECT t.id, t.token_number, t.status, t.created_at, t.called_at, t.served_at
             FROM tokens t 
             WHERE t.service_id = ? AND DATE(t.created_at) = CURDATE()
             ORDER BY t.created_at ASC`,
            [serviceId]
        );

        // Get counts
        const waiting = tokens.filter(t => t.status === 'waiting').length;
        const served = tokens.filter(t => t.status === 'served').length;
        const currentToken = tokens.find(t => t.status === 'called' || t.status === 'serving');

        res.json({
            success: true,
            queue: {
                total: tokens.length,
                waiting,
                served,
                current_token: currentToken ? currentToken.token_number : 'None',
                tokens
            }
        });

    } catch (error) {
        console.error('Queue status error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch queue status' });
    }
});

// ============================================
// GET /api/queue/waiting/:serviceId — Waiting tokens (staff)
// ============================================
router.get('/waiting/:serviceId', isAuthenticated, isStaff, async (req, res) => {
    try {
        const { serviceId } = req.params;

        const [tokens] = await pool.query(
            `SELECT t.*, u.name as user_name 
             FROM tokens t 
             JOIN users u ON t.user_id = u.id 
             WHERE t.service_id = ? AND t.status = 'waiting' AND DATE(t.created_at) = CURDATE()
             ORDER BY t.created_at ASC`,
            [serviceId]
        );

        res.json({ success: true, tokens });

    } catch (error) {
        console.error('Waiting tokens error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch waiting tokens' });
    }
});

// ============================================
// PUT /api/queue/call-next/:serviceId — Call next token (staff)
// ============================================
router.put('/call-next/:serviceId', isAuthenticated, isStaff, async (req, res) => {
    try {
        const { serviceId } = req.params;
        const staffId = req.session.user.id;

        // Check if there's already a called/serving token
        const [active] = await pool.query(
            `SELECT * FROM tokens 
             WHERE service_id = ? AND status IN ('called', 'serving') AND DATE(created_at) = CURDATE()`,
            [serviceId]
        );

        if (active.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'There is already an active token being served. Please serve or skip it first.',
                active_token: active[0]
            });
        }

        // Get next waiting token
        const [waiting] = await pool.query(
            `SELECT * FROM tokens 
             WHERE service_id = ? AND status = 'waiting' AND DATE(created_at) = CURDATE()
             ORDER BY created_at ASC LIMIT 1`,
            [serviceId]
        );

        if (waiting.length === 0) {
            return res.json({ success: true, message: 'No tokens waiting in queue', token: null });
        }

        const token = waiting[0];

        // Update token status to called
        await pool.query(
            `UPDATE tokens SET status = 'called', called_at = NOW(), served_by = ? WHERE id = ?`,
            [staffId, token.id]
        );

        res.json({
            success: true,
            message: `Token ${token.token_number} has been called`,
            token: { ...token, status: 'called', served_by: staffId }
        });

    } catch (error) {
        console.error('Call next error:', error);
        res.status(500).json({ success: false, message: 'Failed to call next token' });
    }
});

// ============================================
// GET /api/queue/current/:serviceId — Current active token (staff)
// ============================================
router.get('/current/:serviceId', isAuthenticated, isStaff, async (req, res) => {
    try {
        const { serviceId } = req.params;

        const [tokens] = await pool.query(
            `SELECT t.*, u.name as user_name 
             FROM tokens t 
             JOIN users u ON t.user_id = u.id 
             WHERE t.service_id = ? AND t.status IN ('called', 'serving') AND DATE(t.created_at) = CURDATE()
             ORDER BY t.called_at DESC LIMIT 1`,
            [serviceId]
        );

        res.json({
            success: true,
            token: tokens.length > 0 ? tokens[0] : null
        });

    } catch (error) {
        console.error('Current token error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch current token' });
    }
});

// ============================================
// PUT /api/queue/serve/:tokenId — Mark token as served (staff)
// ============================================
router.put('/serve/:tokenId', isAuthenticated, isStaff, async (req, res) => {
    try {
        const { tokenId } = req.params;

        const [tokens] = await pool.query('SELECT * FROM tokens WHERE id = ?', [tokenId]);
        if (tokens.length === 0) {
            return res.status(404).json({ success: false, message: 'Token not found' });
        }

        const token = tokens[0];
        if (token.status !== 'called' && token.status !== 'serving') {
            return res.status(400).json({ success: false, message: 'Token is not in called/serving status' });
        }

        await pool.query(
            `UPDATE tokens SET status = 'served', served_at = NOW() WHERE id = ?`,
            [tokenId]
        );

        res.json({
            success: true,
            message: `Token ${token.token_number} marked as served`
        });

    } catch (error) {
        console.error('Serve token error:', error);
        res.status(500).json({ success: false, message: 'Failed to serve token' });
    }
});

// ============================================
// PUT /api/queue/skip/:tokenId — Skip a token (staff)
// ============================================
router.put('/skip/:tokenId', isAuthenticated, isStaff, async (req, res) => {
    try {
        const { tokenId } = req.params;

        const [tokens] = await pool.query('SELECT * FROM tokens WHERE id = ?', [tokenId]);
        if (tokens.length === 0) {
            return res.status(404).json({ success: false, message: 'Token not found' });
        }

        const token = tokens[0];
        if (token.status === 'served' || token.status === 'skipped') {
            return res.status(400).json({ success: false, message: 'Token is already served or skipped' });
        }

        await pool.query(
            `UPDATE tokens SET status = 'skipped', served_at = NOW() WHERE id = ?`,
            [tokenId]
        );

        res.json({
            success: true,
            message: `Token ${token.token_number} has been skipped`
        });

    } catch (error) {
        console.error('Skip token error:', error);
        res.status(500).json({ success: false, message: 'Failed to skip token' });
    }
});

module.exports = router;
