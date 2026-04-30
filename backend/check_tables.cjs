require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkRemoteTables() {
    console.log('Checking tables in remote database...');
    
    try {
        const pool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });
        
        const [rows] = await pool.query('SHOW TABLES');
        console.log('✅ Tables found in remote DB:');
        rows.forEach(row => console.log(Object.values(row)[0]));
        
        await pool.end();
    } catch (err) {
        console.error('❌ Failed to fetch tables:');
        console.error('Error:', err.message);
    }
}

checkRemoteTables();
