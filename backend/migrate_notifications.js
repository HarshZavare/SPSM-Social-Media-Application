require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT,
        link VARCHAR(255),
        from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_notif_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_notif_read ON notifications(user_id, is_read);
    `);
    console.log('Notifications table created successfully');
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

migrate();
