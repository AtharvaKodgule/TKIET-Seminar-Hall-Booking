const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ak@7588',
    database: process.env.DB_NAME || 'seminar_hall_booking'
});

// Get all time slots
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching time slots...');
        const [timeSlots] = await pool.execute(
            'SELECT id, slot_name, start_time, end_time, is_full_day FROM time_slots ORDER BY start_time'
        );
        
        console.log('Time slots fetched:', timeSlots);
        res.json(timeSlots);
    } catch (error) {
        console.error('Error fetching time slots:', error);
        res.status(500).json({ 
            message: 'Error fetching time slots',
            error: error.message 
        });
    }
});

module.exports = router; 