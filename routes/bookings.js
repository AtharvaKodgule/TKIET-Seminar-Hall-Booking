const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const { authenticateToken } = require('../middleware/auth');
const { sendBookingNotificationToAdmin } = require('../utils/emailService');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ak@7588',
    database: process.env.DB_NAME || 'seminar_hall_booking'
});

// Get all bookings (admin only)
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [bookings] = await pool.execute(`
            SELECT 
                b.*,
                u.full_name,
                h.name as hall_name,
                u.department,
                ts.slot_name,
                ts.start_time,
                ts.end_time
            FROM bookings b 
            JOIN users u ON b.user_id = u.id 
            JOIN halls h ON b.hall_id = h.id 
            JOIN time_slots ts ON b.time_slot_id = ts.id
            ORDER BY b.created_at DESC
        `);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).json({ message: 'Error fetching bookings' });
    }
});

// Get pending bookings (admin only)
router.get('/pending', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const [bookings] = await pool.execute(`
            SELECT 
                b.*,
                h.name as hall_name,
                u.full_name,
                u.department,
                ts.slot_name,
                ts.start_time,
                ts.end_time
            FROM bookings b 
            JOIN halls h ON b.hall_id = h.id 
            JOIN users u ON b.user_id = u.id
            JOIN time_slots ts ON b.time_slot_id = ts.id
            WHERE b.status = 'PENDING'
            ORDER BY b.created_at DESC
        `);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching pending bookings:', error);
        res.status(500).json({ message: 'Error fetching pending bookings' });
    }
});


// Get user's bookings
router.get('/:userId', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.userId;
        
        // Verify that the requesting user is either an admin or the user themselves
        if (req.user.userType !== 'admin' && req.user.id !== parseInt(userId)) {
            return res.status(403).json({ message: 'Access denied' });
        }

        console.log('Fetching bookings for user:', userId);
        
        const [bookings] = await pool.execute(`
            SELECT 
                b.id,
                b.user_id,
                b.hall_id,
                b.booking_date,
                b.time_slot_id,
                ts.start_time,
                ts.end_time,
                ts.slot_name,
                b.purpose,
                b.status,
                b.rejection_reason,
                b.created_at,
                b.updated_at,
                h.name as hall_name,
                u.full_name,
                u.department
            FROM bookings b 
            JOIN halls h ON b.hall_id = h.id 
            JOIN users u ON b.user_id = u.id
            JOIN time_slots ts ON b.time_slot_id = ts.id
            WHERE b.user_id = ? 
            ORDER BY b.created_at DESC
        `, [userId]);
        
        console.log('Raw bookings from database:', bookings); // Add debug log
        console.log('Found bookings:', bookings.length);
        res.json(bookings);
    } catch (error) {
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ 
            message: 'Error fetching bookings',
            details: error.message 
        });
    }
});

// Create new booking
router.post('/', authenticateToken, async (req, res) => {
    try {
        console.log('Creating booking for user:', req.user);

        const { hall_id, booking_date, time_slot_id, purpose } = req.body;
        const user_id = req.user.id;

        console.log('Booking request:', {
            user_id,
            hall_id,
            booking_date,
            time_slot_id,
            purpose
        });

        // Validate required fields
        if (!user_id || !hall_id || !booking_date || !time_slot_id || !purpose) {
            console.log('Missing required fields:', { user_id, hall_id, booking_date, time_slot_id, purpose });
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Parse and validate the booking date
        let parsedDate;
        try {
            parsedDate = new Date(booking_date);
            if (isNaN(parsedDate.getTime())) {
                return res.status(400).json({ message: 'Invalid date format' });
            }
        } catch (error) {
            console.error('Date parsing error:', error);
            return res.status(400).json({ message: 'Invalid date format' });
        }

        // Format date as YYYY-MM-DD for MySQL DATE column
        const formattedBookingDate = parsedDate.toISOString().split('T')[0];
        
        console.log('Parsed booking date:', {
            original: booking_date,
            parsed: parsedDate,
            formatted: formattedBookingDate
        });

        // Check if hall exists and is available
        const [halls] = await pool.execute(
            'SELECT * FROM halls WHERE id = ? AND status = "active"',
            [hall_id]
        );

        if (halls.length === 0) {
            console.log('Hall not found or not available:', hall_id);
            return res.status(400).json({ 
                message: 'Hall not found or not available',
                details: `No active hall found with ID: ${hall_id}`
            });
        }

        // Get time slot details
        const [timeSlots] = await pool.execute(
            'SELECT * FROM time_slots WHERE id = ?',
            [time_slot_id]
        );

        if (timeSlots.length === 0) {
            return res.status(400).json({ message: 'Invalid time slot selected' });
        }

        const timeSlot = timeSlots[0];

        // Check if date is in the future
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (parsedDate < today) {
            console.log('Invalid booking date:', booking_date);
            return res.status(400).json({ message: 'Booking date must be in the future' });
        }

        console.log('Checking for booking conflicts with:', {
            hall_id,
            formatted_date: formattedBookingDate,
            time_slot_id
        });

        // Test query to check all bookings for the hall on that day (debugging)
        const [allBookingsForDay] = await pool.execute(
            `SELECT b.id, b.hall_id, b.booking_date, b.time_slot_id, b.status, ts.slot_name
            FROM bookings b
            JOIN time_slots ts ON b.time_slot_id = ts.id
            WHERE b.hall_id = ? 
            AND b.booking_date = ?
            AND b.status IN ('APPROVED', 'PENDING')`,
            [hall_id, formattedBookingDate]
        );
        
        console.log('All bookings for hall on this day:', allBookingsForDay);

        // Note: Conflict checking code has been removed to allow multiple bookings for the same hall, date and timeslot

        // Create booking with default status 'pending'
        const [result] = await pool.execute(
            'INSERT INTO bookings (user_id, hall_id, booking_date, time_slot_id, purpose, status) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, hall_id, formattedBookingDate, time_slot_id, purpose, 'PENDING']
        );

        console.log('Booking created successfully:', result.insertId);

        // Fetch the created booking with joined data
        const [newBooking] = await pool.execute(`
            SELECT 
                b.*,
                h.name as hall_name,
                u.full_name,
                u.department,
                ts.slot_name,
                ts.start_time,
                ts.end_time
            FROM bookings b
            JOIN halls h ON b.hall_id = h.id
            JOIN users u ON b.user_id = u.id
            JOIN time_slots ts ON b.time_slot_id = ts.id
            WHERE b.id = ?
        `, [result.insertId]);

        // Send email notification to admin
        if (newBooking.length > 0) {
            try {
                await sendBookingNotificationToAdmin(newBooking[0]);
                console.log('Admin notification email sent successfully');
            } catch (emailError) {
                console.error('Error sending admin notification email:', emailError);
                // Don't return error to client if email fails
            }
        }

        res.status(201).json({
            message: 'Booking request submitted successfully',
            booking: newBooking[0]
        });
    } catch (error) {
        console.error('Error creating booking:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            sqlMessage: error.sqlMessage,
            sqlState: error.sqlState
        });

        if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.sqlMessage?.includes('foreign key constraint fails')) {
            return res.status(400).json({ 
                message: 'Invalid hall ID or time slot ID',
                details: 'Please select a valid hall and time slot.'
            });
        }

        res.status(500).json({ 
            message: 'Error creating booking',
            details: error.message 
        });
    }
});

// Approve booking (admin only)
router.put('/:id/approve', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        // First check if the booking exists and is in PENDING state
        const [booking] = await pool.execute(
            'SELECT status FROM bookings WHERE id = ?',
            [req.params.id]
        );

        if (booking.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking[0].status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Cannot approve booking',
                details: 'Only pending bookings can be approved'
            });
        }

        // Update the booking status
        const [result] = await pool.execute(
            'UPDATE bookings SET status = "APPROVED", updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        res.json({ 
            message: 'Booking approved successfully',
            bookingId: req.params.id
        });
    } catch (error) {
        console.error('Error approving booking:', error);
        res.status(500).json({ 
            message: 'Error approving booking',
            details: error.message
        });
    }
});

// Reject booking (admin only)
router.put('/:id/reject', authenticateToken, async (req, res) => {
    try {
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { rejection_reason } = req.body;
        console.log('Received rejection request:', { bookingId: req.params.id, rejection_reason }); // Debug log

        if (!rejection_reason || !rejection_reason.trim()) {
            return res.status(400).json({ message: 'Rejection reason is required' });
        }

        // First check if the booking exists and is in PENDING state
        const [booking] = await pool.execute(
            'SELECT status FROM bookings WHERE id = ?',
            [req.params.id]
        );

        if (booking.length === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (booking[0].status !== 'PENDING') {
            return res.status(400).json({ 
                message: 'Cannot reject booking',
                details: 'Only pending bookings can be rejected'
            });
        }

        console.log('Rejecting booking with reason:', rejection_reason); // Debug log

        // Update the booking status and add rejection reason
        const [result] = await pool.execute(
            'UPDATE bookings SET status = "REJECTED", rejection_reason = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [rejection_reason.trim(), req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Fetch the updated booking to verify
        const [updatedBooking] = await pool.execute(
            'SELECT id, status, rejection_reason FROM bookings WHERE id = ?',
            [req.params.id]
        );

        console.log('Updated booking:', updatedBooking[0]); // Debug log

        res.json({ 
            message: 'Booking rejected successfully',
            bookingId: req.params.id,
            status: 'REJECTED',
            rejection_reason: rejection_reason.trim()
        });
    } catch (error) {
        console.error('Error rejecting booking:', error);
        res.status(500).json({ 
            message: 'Error rejecting booking',
            details: error.message
        });
    }
});

module.exports = router; 