const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Ak@7588',
            database: process.env.DB_NAME || 'seminar_hall_booking'
        });

        console.log('Database connection successful!');

        // Test admin user
        const [admins] = await connection.execute(
            'SELECT * FROM admins WHERE email = ?',
            ['admin@123']
        );

        if (admins.length > 0) {
            console.log('Admin user found:', {
                id: admins[0].id,
                email: admins[0].email,
                full_name: admins[0].full_name
            });
        } else {
            console.log('Admin user not found!');
        }

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

testConnection(); 