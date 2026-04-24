require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    await pool.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP;
      
      ALTER TABLE privacy_settings ADD COLUMN IF NOT EXISTS last_seen_visibility privacy_level DEFAULT 'FRIENDS_ONLY';
    `);
    console.log('Successfully added last active tracking columns.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    pool.end();
  }
}

migrate();
