require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    await pool.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT \'sent\';');
    console.log('Added status column to messages');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
migrate();
