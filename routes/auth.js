const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');
const NotificationService = require('../services/notification');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

// Create database connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Ak@7588',
    database: process.env.DB_NAME || 'seminar_hall_booking'
});

// Default JWT secret if not set in environment
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-2024';

// Register admin user (protected route requiring admin privileges)
router.post('/register-admin', authenticateToken, async (req, res) => {
    try {
        // Check if the requester is an admin
        if (req.user.userType !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }

        console.log('Admin registration request received:', {
            full_name: req.body.full_name,
            email: req.body.email,
            passwordLength: req.body.password ? req.body.password.length : 0
        });

        const { full_name, email, password } = req.body;

        // Validate required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if admin already exists
        const [existingAdmin] = await pool.execute(
            'SELECT * FROM admins WHERE email = ?',
            [email]
        );

        if (existingAdmin.length > 0) {
            console.log('Admin already exists:', email);
            return res.status(400).json({ message: 'Admin with this email already exists.' });
        }

        // Store plain text password
        const plainPassword = password;

        // Insert new admin
        const [result] = await pool.execute(
            'INSERT INTO admins (full_name, email, password) VALUES (?, ?, ?)',
            [full_name, email, plainPassword]
        );

        console.log('Admin registered successfully:', {
            id: result.insertId,
            email: email
        });

        res.status(201).json({
            message: 'Admin registered successfully',
            admin: {
                id: result.insertId,
                full_name,
                email
            }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ message: 'Error registering admin.' });
    }
});

// Register new user
router.post('/register', async (req, res) => {
    try {
        console.log('Registration request received:', {
            full_name: req.body.full_name,
            email: req.body.email,
            gr_number: req.body.gr_number,
            department: req.body.department,
            passwordLength: req.body.password ? req.body.password.length : 0
        });

        const { full_name, email, password, department, gr_number } = req.body;

        // Validate required fields
        if (!full_name || !email || !password || !department || !gr_number) {
            console.log('Missing required fields:', {
                full_name: !full_name,
                email: !email,
                gr_number: !gr_number,
                password: !password,
                department: !department
            });
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check if user already exists
        const [existingUser] = await pool.execute(
            'SELECT * FROM users WHERE email = ? OR gr_number = ?',
            [email, gr_number]
        );

        if (existingUser.length > 0) {
            console.log('User already exists:', email);
            return res.status(400).json({ message: 'User already exists with this email or GR number.' });
        }

        // Store plain text password
        const plainPassword = password;

        // Insert new user
        const [result] = await pool.execute(
            'INSERT INTO users (full_name, email, gr_number, password, department) VALUES (?, ?, ?, ?, ?)',
            [full_name, email, gr_number, plainPassword, department]
        );

        console.log('User registered successfully:', {
            id: result.insertId,
            email: email,
            gr_number: gr_number
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: result.insertId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                full_name,
                email,
                gr_number,
                department,
                userType: 'user'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Error registering user.' });
    }
});

// Login route
router.post('/login', async (req, res) => {
    try {
        console.log('Login request received:', {
            email: req.body.email,
            userType: req.body.userType,
            passwordLength: req.body.password ? req.body.password.length : 0
        });
        
        const { email, password, userType } = req.body;

        // Validate input
        if (!email || !password || !userType) {
            console.log('Missing required fields:', { 
                email: !!email, 
                password: !!password, 
                userType: !!userType 
            });
            return res.status(400).json({ 
                message: 'Please provide email, password and user type',
                details: {
                    email: !email ? 'Email is required' : null,
                    password: !password ? 'Password is required' : null,
                    userType: !userType ? 'User type is required' : null
                }
            });
        }

        // Determine which table to query based on userType
        const table = userType === 'admin' ? 'admins' : 'users';
        console.log('Querying table:', table);
        
        // Query the appropriate table
        const [rows] = await pool.execute(
            `SELECT * FROM ${table} WHERE email = ?`,
            [email]
        );

        console.log('Query result:', {
            found: rows.length > 0,
            email: email,
            table: table
        });

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const user = rows[0];
        console.log('Found user:', {
            id: user.id,
            email: user.email,
            full_name: user.full_name
        });

        // Check plain text password for both users and admins
        if (password !== user.password) {
            console.log('Password mismatch');
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email,
                userType: userType
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('Login successful for:', email);

        // Send response
        res.json({
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                userType: userType
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Internal server error',
            error: error.message 
        });
    }
});

// Get current user route
router.get('/me', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ message: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const userType = decoded.userType;
        const table = userType === 'admin' ? 'admins' : 'users';

        const [rows] = await pool.execute(
            `SELECT id, full_name, email FROM ${table} WHERE id = ?`,
            [decoded.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            ...rows[0],
            userType
        });

    } catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
});

module.exports = router; 