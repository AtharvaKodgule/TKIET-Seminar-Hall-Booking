const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const pool = require('../config/database');

// Get all halls
router.get('/', async (req, res) => {
    try {
        const [halls] = await pool.query('SELECT * FROM halls WHERE status = "active"');
        res.json(halls);
    } catch (error) {
        console.error('Error fetching halls:', error);
        res.status(500).json({ message: 'Error fetching halls.' });
    }
});

// Get hall by ID
router.get('/:id', async (req, res) => {
    try {
        const [halls] = await pool.query('SELECT * FROM halls WHERE id = ?', [req.params.id]);
        if (halls.length === 0) {
            return res.status(404).json({ message: 'Hall not found.' });
        }
        res.json(halls[0]);
    } catch (error) {
        console.error('Error fetching hall:', error);
        res.status(500).json({ message: 'Error fetching hall.' });
    }
});

// Check hall availability
router.get('/:id/availability', async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: 'Date is required.' });
        }

        const [bookings] = await pool.query(
            `SELECT * FROM bookings 
            WHERE hall_id = ? AND booking_date = ? AND status = 'APPROVED'`,
            [req.params.id, date]
        );

        res.json(bookings);
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ message: 'Error checking hall availability.' });
    }
});

// Admin routes
// Add new hall
router.post('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        console.log('Adding new hall. Request body:', req.body);
        console.log('User:', req.user);

        const { hall_name, capacity, facilities, status } = req.body;

        // Validate required fields
        if (!hall_name || !capacity) {
            console.log('Validation failed: Missing required fields');
            return res.status(400).json({ message: 'Hall name and capacity are required.' });
        }

        // Insert new hall
        const [result] = await pool.query(
            'INSERT INTO halls (hall_name, capacity, facilities, status) VALUES (?, ?, ?, ?)',
            [hall_name, capacity, JSON.stringify(facilities), status || 'active']
        );

        console.log('Hall inserted with ID:', result.insertId);

        // Get the newly created hall
        const [halls] = await pool.query('SELECT * FROM halls WHERE id = ?', [result.insertId]);

        res.status(201).json({
            message: 'Hall added successfully',
            hall: halls[0]
        });
    } catch (error) {
        console.error('Error adding hall:', error);
        res.status(500).json({ message: 'Error adding hall.' });
    }
});

// Update hall
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { hall_name, capacity, facilities, status } = req.body;
        const hallId = req.params.id;

        // Check if hall exists
        const [existingHalls] = await pool.query('SELECT * FROM halls WHERE id = ?', [hallId]);
        if (existingHalls.length === 0) {
            return res.status(404).json({ message: 'Hall not found.' });
        }

        // Update hall
        await pool.query(
            'UPDATE halls SET hall_name = ?, capacity = ?, facilities = ?, status = ? WHERE id = ?',
            [hall_name, capacity, JSON.stringify(facilities), status, hallId]
        );

        // Get updated hall
        const [updatedHalls] = await pool.query('SELECT * FROM halls WHERE id = ?', [hallId]);

        res.json({
            message: 'Hall updated successfully',
            hall: updatedHalls[0]
        });
    } catch (error) {
        console.error('Error updating hall:', error);
        res.status(500).json({ message: 'Error updating hall.' });
    }
});

// Delete hall
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const hallId = req.params.id;

        // Check if hall exists
        const [existingHalls] = await pool.query('SELECT * FROM halls WHERE id = ?', [hallId]);
        if (existingHalls.length === 0) {
            return res.status(404).json({ message: 'Hall not found.' });
        }

        // Delete hall
        await pool.query('DELETE FROM halls WHERE id = ?', [hallId]);

        res.json({ message: 'Hall deleted successfully' });
    } catch (error) {
        console.error('Error deleting hall:', error);
        res.status(500).json({ message: 'Error deleting hall.' });
    }
});

module.exports = router; 