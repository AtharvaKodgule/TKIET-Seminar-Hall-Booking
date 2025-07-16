const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupAdmin() {
    try {
        // Create connection
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        // Admin credentials
        const admins = [
            {
                email: 'admin@tkiet.edu',
                password: 'admin123',
                full_name: 'Admin User 1'
            },
            {
                email: 'admin@123',
                password: 'admin@123',
                full_name: 'Admin User 2'
            }
        ];

        for (const admin of admins) {
            // Check if admin exists
            const [existingAdmin] = await connection.execute(
                'SELECT * FROM users WHERE email = ?',
                [admin.email]
            );

            if (existingAdmin.length > 0) {
                // Update existing admin
                await connection.execute(
                    'UPDATE users SET password = ?, role = ? WHERE email = ?',
                    [admin.password, 'admin', admin.email]
                );
                console.log(`Admin ${admin.email} updated successfully`);
            } else {
                // Create new admin user
                await connection.execute(
                    'INSERT INTO users (full_name, email, password, department, role) VALUES (?, ?, ?, ?, ?)',
                    [admin.full_name, admin.email, admin.password, 'Administration', 'admin']
                );
                console.log(`Admin ${admin.email} created successfully`);
            }
        }

        console.log('Admin setup completed');
        console.log('Admin 1:');
        console.log('Email:', admins[0].email);
        console.log('Password:', admins[0].password);
        console.log('\nAdmin 2:');
        console.log('Email:', admins[1].email);
        console.log('Password:', admins[1].password);
        
        await connection.end();
    } catch (error) {
        console.error('Error setting up admin:', error);
    }
}

// Run the setup
setupAdmin(); 