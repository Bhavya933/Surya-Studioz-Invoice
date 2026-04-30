require('dotenv').config({ path: '../.env' }); // Assuming run from backend/
console.log('Password length:', process.env.DB_PASSWORD ? process.env.DB_PASSWORD.length : 0);
console.log('Password wrapped in quotes?', process.env.DB_PASSWORD.startsWith('"'));
