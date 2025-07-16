const mysql = require('mysql2/promise');
require('dotenv').config();

async function verifyAdmin() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Ak@7588',
            database: process.env.DB_NAME || 'seminar_hall_booking'
        });

        console.log('Database connection successful!');

        // Check if admins table exists
        const [tables] = await connection.execute(
            "SHOW TABLES LIKE 'admins'"
        );

        if (tables.length === 0) {
            console.log('Admins table does not exist!');
            return;
        }

        // Check admin user
        const [admins] = await connection.execute(
            'SELECT * FROM admins WHERE email = ?',
            ['admin@123']
        );

        if (admins.length > 0) {
            console.log('Admin user found:', {
                id: admins[0].id,
                email: admins[0].email,
                full_name: admins[0].full_name,
                password: admins[0].password
            });
        } else {
            console.log('Admin user not found!');
            
            // Insert admin user
            await connection.execute(
                'INSERT INTO admins (full_name, email, password) VALUES (?, ?, ?)',
                ['Admin User', 'admin@123', 'admin@123']
            );
            console.log('Admin user created successfully!');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

verifyAdmin(); 