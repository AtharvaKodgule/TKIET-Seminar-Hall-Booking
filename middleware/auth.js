const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Access denied. No token provided.' });
        }

        console.log('Verifying token with secret:', process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024');
        console.log('Decoded token:', decoded);
        
        // Get user from database based on userType
        const table = decoded.userType === 'admin' ? 'admins' : 'users';
        const query = table === 'admins' 
            ? 'SELECT id, full_name, email FROM admins WHERE id = ?'
            : 'SELECT id, full_name, email, department FROM users WHERE id = ?';

        const [users] = await pool.query(query, [decoded.id]);

        if (users.length === 0) {
            console.log('No user found in database for id:', decoded.id);
            return res.status(401).json({ message: 'Invalid token.' });
        }

        console.log('Found user:', users[0]);
        req.user = { ...users[0], userType: decoded.userType };
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token has expired' });
        }
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ message: 'Invalid token format' });
        }
        res.status(401).json({ message: 'Invalid token.' });
    }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.userType === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

module.exports = {
    authenticateToken,
    isAdmin
}; 