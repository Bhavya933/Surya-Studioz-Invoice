require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateLiveDatabase() {
    console.log('Connecting to Live Database to add missing columns...');
    try {
        const pool = mysql.createPool({
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        });
        
        // 1. Change status ENUM to VARCHAR to prevent validation errors on new steps
        await pool.query("ALTER TABLE projects MODIFY COLUMN status VARCHAR(50) DEFAULT 'Upcoming'");
        console.log('✅ Status column updated.');

        // 2. Add all missing columns
        const newColumns = [
            "ADD COLUMN msg1Sent BOOLEAN DEFAULT FALSE",
            "ADD COLUMN msg2Sent BOOLEAN DEFAULT FALSE",
            "ADD COLUMN editorMsgSent BOOLEAN DEFAULT FALSE",
            "ADD COLUMN designerMsgSent BOOLEAN DEFAULT FALSE",
            "ADD COLUMN clientMsgSent BOOLEAN DEFAULT FALSE",
            "ADD COLUMN happyMsgSent BOOLEAN DEFAULT FALSE",
            "ADD COLUMN dataFromClient VARCHAR(50) DEFAULT 'Pending'",
            "ADD COLUMN dataToStudio VARCHAR(50) DEFAULT 'Pending'",
            "ADD COLUMN deliveryDeadline DATE",
            "ADD COLUMN deadlineDate DATE",
            "ADD COLUMN reelsCount INT DEFAULT 0",
            "ADD COLUMN albumRequired BOOLEAN DEFAULT FALSE",
            "ADD COLUMN dataToDesigner VARCHAR(50) DEFAULT 'Pending'",
            "ADD COLUMN albumDeadline DATE"
        ];

        for (let col of newColumns) {
            try {
                await pool.query(`ALTER TABLE projects ${col}`);
                console.log(`✅ ${col}`);
            } catch (err) {
                if (err.code === 'ER_DUP_FIELDNAME') {
                    console.log(`ℹ️ Column already exists: ${col}`);
                } else {
                    console.error(`❌ Error adding column: ${col}`, err.message);
                }
            }
        }
        
        console.log('🎉 Live Database Update Complete!');
        await pool.end();
    } catch (err) {
        console.error('❌ Database Connection Failed:', err.message);
    }
}

updateLiveDatabase();
