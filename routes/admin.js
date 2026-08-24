const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// ============================================
// GET /api/admin/dashboard — Dashboard statistics
// ============================================
router.get('/dashboard', isAuthenticated, isAdmin, async (req, res) => {
    try {
        // Total tokens today
        const [totalResult] = await pool.query(
            `SELECT COUNT(*) as total FROM tokens WHERE DATE(created_at) = CURDATE()`
        );

        // Waiting tokens
        const [waitingResult] = await pool.query(
            `SELECT COUNT(*) as waiting FROM tokens WHERE status = 'waiting' AND DATE(created_at) = CURDATE()`
        );

        // Served tokens
        const [servedResult] = await pool.query(
            `SELECT COUNT(*) as served FROM tokens WHERE status = 'served' AND DATE(created_at) = CURDATE()`
        );

        // Skipped tokens
        const [skippedResult] = await pool.query(
            `SELECT COUNT(*) as skipped FROM tokens WHERE status = 'skipped' AND DATE(created_at) = CURDATE()`
        );

        // Currently being served
        const [activeResult] = await pool.query(
            `SELECT COUNT(*) as active FROM tokens WHERE status IN ('called', 'serving') AND DATE(created_at) = CURDATE()`
        );

        // Average wait time (for served tokens today)
        const [avgWaitResult] = await pool.query(
            `SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, served_at)) as avg_wait 
             FROM tokens 
             WHERE status = 'served' AND DATE(created_at) = CURDATE() AND served_at IS NOT NULL`
        );

        // Per-service breakdown
        const [serviceBreakdown] = await pool.query(
            `SELECT s.name, s.prefix,
                    COUNT(t.id) as total,
                    SUM(CASE WHEN t.status = 'waiting' THEN 1 ELSE 0 END) as waiting,
                    SUM(CASE WHEN t.status = 'served' THEN 1 ELSE 0 END) as served,
                    SUM(CASE WHEN t.status IN ('called', 'serving') THEN 1 ELSE 0 END) as active
             FROM services s
             LEFT JOIN tokens t ON s.id = t.service_id AND DATE(t.created_at) = CURDATE()
             WHERE s.is_active = TRUE
             GROUP BY s.id, s.name, s.prefix
             ORDER BY s.name ASC`
        );

        res.json({
            success: true,
            stats: {
                total_today: totalResult[0].total,
                waiting: waitingResult[0].waiting,
                served: servedResult[0].served,
                skipped: skippedResult[0].skipped,
                active: activeResult[0].active,
                avg_wait_minutes: Math.round(avgWaitResult[0].avg_wait || 0),
                service_breakdown: serviceBreakdown
            }
        });

    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
    }
});

// ============================================
// GET /api/admin/users — List all users
// ============================================
router.get('/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [users] = await pool.query(
            'SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC'
        );
        res.json({ success: true, users });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
});

// ============================================
// PUT /api/admin/users/:id/role — Change user role
// ============================================
router.put('/users/:id/role', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'staff', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role. Must be user, staff, or admin' });
        }

        // Prevent self-demotion
        if (parseInt(id) === req.session.user.id) {
            return res.status(400).json({ success: false, message: 'You cannot change your own role' });
        }

        const [result] = await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, message: `User role updated to ${role}` });

    } catch (error) {
        console.error('Change role error:', error);
        res.status(500).json({ success: false, message: 'Failed to change user role' });
    }
});

module.exports = router;
