const nodemailer = require('nodemailer');
const pool = require('../config/database');

// Create email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Store active notifications in memory (in production, use Redis or similar)
const activeNotifications = new Map();

class NotificationService {
    // Create a new notification
    static async createNotification(userId, type, message, bookingId = null) {
        try {
            // Store notification in database
            const [result] = await pool.query(
                'INSERT INTO notifications (user_id, type, message, booking_id) VALUES (?, ?, ?, ?)',
                [userId, type, message, bookingId]
            );

            const notification = {
                id: result.insertId,
                userId,
                type,
                message,
                bookingId,
                createdAt: new Date()
            };

            // Store in active notifications
            if (!activeNotifications.has(userId)) {
                activeNotifications.set(userId, []);
            }
            activeNotifications.get(userId).push(notification);

            // Send email notification
            await this.sendEmailNotification(userId, type, message);

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    // Get user's notifications
    static async getUserNotifications(userId) {
        try {
            const [notifications] = await pool.query(
                'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
                [userId]
            );
            return notifications;
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    // Mark notification as read
    static async markAsRead(notificationId) {
        try {
            await pool.query(
                'UPDATE notifications SET is_read = true WHERE id = ?',
                [notificationId]
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // Send email notification
    static async sendEmailNotification(userId, type, message) {
        try {
            // Get user email
            const [users] = await pool.query(
                'SELECT email, full_name FROM users WHERE id = ?',
                [userId]
            );

            if (users.length === 0) return;

            const user = users[0];
            const subject = `Booking ${type} Notification`;
            const html = `
                <h2>Hello ${user.full_name},</h2>
                <p>${message}</p>
                <p>Thank you for using our Seminar Hall Booking System.</p>
            `;

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject,
                html
            });
        } catch (error) {
            console.error('Error sending email notification:', error);
            // Don't throw error to prevent blocking the main flow
        }
    }

    // Get active notifications for a user
    static getActiveNotifications(userId) {
        return activeNotifications.get(userId) || [];
    }

    // Clear active notifications for a user
    static clearActiveNotifications(userId) {
        activeNotifications.delete(userId);
    }
}

module.exports = NotificationService; 