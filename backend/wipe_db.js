require('dotenv').config();
const { pool } = require('./config/db');

async function wipeDatabase() {
  try {
    console.log(`Connecting to database ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}...`);
    
    // We use CASCADE to handle foreign key dependencies automatically
    const query = `
      TRUNCATE TABLE 
        security_logs, 
        password_resets, 
        files, 
        messages, 
        user_encryption_keys, 
        privacy_settings, 
        otp_codes, 
        friendships, 
        users 
      CASCADE;
    `;
    
    await pool.query(query);
    console.log('✅ Successfully removed all records from the database tables.');
  } catch (error) {
    console.error('❌ Error wiping database:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('   Please make sure your PostgreSQL server is running and accessible.');
    }
  } finally {
    await pool.end();
  }
}

wipeDatabase();
