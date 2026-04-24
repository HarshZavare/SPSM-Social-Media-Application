require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comment_likes (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        comment_id UUID NOT NULL REFERENCES post_comments(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(comment_id, user_id)
      );

      ALTER TABLE post_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;
    `);
    console.log('Comment likes table and reply support added successfully');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

migrate();
