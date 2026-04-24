require('dotenv').config();
const { pool } = require('./config/db');

console.log('Connecting to:', process.env.DB_NAME, 'on', process.env.DB_HOST);

async function listUsers() {
  try {
    const res = await pool.query('SELECT email, password_hash, username FROM users');
    console.log('--- Registered Users ---');
    if (res.rows.length === 0) {
      console.log('No users found.');
    } else {
      res.rows.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Username: ${user.username}`);
        console.log(`   Password Hash: ${user.password_hash}`);
        console.log('------------------------');
      });
    }
  } catch (err) {
    console.error('Error fetching users:', err);
  } finally {
    await pool.end();
  }
}

listUsers();

