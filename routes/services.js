const express = require('express');
const router = express.Router();
const { pool } = require('../config/db');
const { isAuthenticated, isAdmin } = require('../middleware/auth');

// ============================================
// GET /api/services — List all active services
// ============================================
router.get('/', async (req, res) => {
    try {
        const [services] = await pool.query(
            'SELECT * FROM services WHERE is_active = TRUE ORDER BY name ASC'
        );
        res.json({ success: true, services });
    } catch (error) {
        console.error('Fetch services error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch services' });
    }
});

// ============================================
// GET /api/services/all — List ALL services (admin)
// ============================================
router.get('/all', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const [services] = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
        res.json({ success: true, services });
    } catch (error) {
        console.error('Fetch all services error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch services' });
    }
});

// ============================================
// POST /api/services — Create new service (admin)
// ============================================
router.post('/', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { name, prefix, description } = req.body;

        if (!name || !prefix) {
            return res.status(400).json({ success: false, message: 'Service name and prefix are required' });
        }

        if (prefix.length > 5) {
            return res.status(400).json({ success: false, message: 'Prefix must be 5 characters or less' });
        }

        const [result] = await pool.query(
            'INSERT INTO services (name, prefix, description) VALUES (?, ?, ?)',
            [name, prefix.toUpperCase(), description || '']
        );

        res.status(201).json({
            success: true,
            message: 'Service created successfully',
            service: { id: result.insertId, name, prefix: prefix.toUpperCase(), description, is_active: true }
        });

    } catch (error) {
        console.error('Create service error:', error);
        res.status(500).json({ success: false, message: 'Failed to create service' });
    }
});

// ============================================
// PUT /api/services/:id — Update service (admin)
// ============================================
router.put('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, prefix, description, is_active } = req.body;

        const updates = [];
        const values = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (prefix !== undefined) { updates.push('prefix = ?'); values.push(prefix.toUpperCase()); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        await pool.query(`UPDATE services SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ success: true, message: 'Service updated successfully' });

    } catch (error) {
        console.error('Update service error:', error);
        res.status(500).json({ success: false, message: 'Failed to update service' });
    }
});

// ============================================
// DELETE /api/services/:id — Deactivate service (admin)
// ============================================
router.delete('/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE services SET is_active = FALSE WHERE id = ?', [id]);
        res.json({ success: true, message: 'Service deactivated successfully' });
    } catch (error) {
        console.error('Delete service error:', error);
        res.status(500).json({ success: false, message: 'Failed to deactivate service' });
    }
});

module.exports = router;
