const mysql = require('mysql2/promise');
require('dotenv').config();

async function checkAdmin() {
    let connection;
    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || 'Ak@7588',
            database: process.env.DB_NAME || 'seminar_hall_booking'
        });

        console.log('Database connection successful!');

        // Check if admins table exists
        const [tables] = await connection.execute(`
            SELECT TABLE_NAME 
            FROM information_schema.tables 
            WHERE table_schema = ? 
            AND table_name = 'admins'
        `, [process.env.DB_NAME || 'seminar_hall_booking']);

        if (tables.length === 0) {
            console.log('Error: admins table does not exist!');
            return;
        }

        // Get all admin users
        const [admins] = await connection.execute('SELECT * FROM admins');
        console.log('\nAll admin users in database:');
        console.log('------------------------');
        admins.forEach(admin => {
            console.log(`ID: ${admin.id}`);
            console.log(`Email: ${admin.email}`);
            console.log(`Full Name: ${admin.full_name}`);
            console.log(`Password: ${admin.password}`);
            console.log('------------------------');
        });

        // Check specific admin
        const [specificAdmin] = await connection.execute(
            'SELECT * FROM admins WHERE email = ?',
            ['admin@123']
        );

        console.log('\nChecking for admin@123:');
        console.log('------------------------');
        if (specificAdmin.length > 0) {
            console.log('Admin found!');
            console.log(`ID: ${specificAdmin[0].id}`);
            console.log(`Email: ${specificAdmin[0].email}`);
            console.log(`Full Name: ${specificAdmin[0].full_name}`);
            console.log(`Password: ${specificAdmin[0].password}`);
        } else {
            console.log('Admin not found!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

checkAdmin(); 