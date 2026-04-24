require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;');
    console.log('Added is_online column');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
migrate();
