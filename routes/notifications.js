const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');

// Get user's notifications
router.get('/', authenticateToken, async (req, res) => {
    try {
        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications.' });
    }
});

// Get active notifications
router.get('/active', authenticateToken, (req, res) => {
    try {
        const notifications = NotificationService.getActiveNotifications(req.user.id);
        res.json(notifications);
    } catch (error) {
        console.error('Error fetching active notifications:', error);
        res.status(500).json({ message: 'Error fetching active notifications.' });
    }
});

// Mark notification as read
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;

        await pool.query(
            'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
            [notificationId, req.user.id]
        );

        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error updating notification.' });
    }
});

// Clear active notifications
router.delete('/active', authenticateToken, (req, res) => {
    try {
        NotificationService.clearActiveNotifications(req.user.id);
        res.json({ message: 'Active notifications cleared.' });
    } catch (error) {
        console.error('Error clearing active notifications:', error);
        res.status(500).json({ message: 'Error clearing active notifications.' });
    }
});

// Delete notification
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const notificationId = req.params.id;

        await pool.query(
            'DELETE FROM notifications WHERE id = ? AND user_id = ?',
            [notificationId, req.user.id]
        );

        res.json({ message: 'Notification deleted successfully' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ message: 'Error deleting notification.' });
    }
});

module.exports = router; 