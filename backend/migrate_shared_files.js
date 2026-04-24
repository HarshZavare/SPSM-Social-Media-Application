require('dotenv').config();
const { pool } = require('./config/db');

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shared_files (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
        shared_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_with UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(file_id, shared_with)
      );

      CREATE INDEX IF NOT EXISTS idx_shared_files_file ON shared_files(file_id);
      CREATE INDEX IF NOT EXISTS idx_shared_files_with ON shared_files(shared_with);
    `);
    console.log('Successfully created shared_files table.');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    pool.end();
  }
}

migrate();
