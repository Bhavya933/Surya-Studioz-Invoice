require('dotenv').config();
const mysql = require('mysql2/promise');

async function testLoginQuery() {
    try {
        const pool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });
        
        console.log('Testing login query...');
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', ['admin']); // Just a test username
        console.log('✅ Query SUCCESSFUL!');
        console.log(users);
        
        await pool.end();
    } catch (err) {
        console.error('❌ Query FAILED:');
        console.error('Error Name:', err.name);
        console.error('Error Code:', err.code);
        console.error('Error Message:', err.message);
    }
}

testLoginQuery();
