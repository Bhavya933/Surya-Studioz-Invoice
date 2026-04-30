const mysql = require('mysql2/promise');
require('dotenv').config();

async function check() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'studio_management',
  });
  
  const [rows] = await pool.query('SELECT id, invoice_number, total_amount, tax_amount FROM invoices LIMIT 5');
  console.log('Invoices:', rows);
  
  const [items] = await pool.query('SELECT * FROM invoice_items WHERE invoice_id = ?', [rows[0].id]);
  console.log('Items for first invoice:', items);
  
  process.exit(0);
}
check();
