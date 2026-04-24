const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'spsm_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', { text: text.substring(0, 80), duration, rows: res.rowCount });
    }
    return res;
  } catch (error) {
    console.error('Database query error:', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
};

const getClient = () => pool.connect();

const initDatabase = async () => {
  const fs = require('fs');
  const path = require('path');
  try {
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
  } finally {
    await pool.end();
  }
};

module.exports = { pool, query, getClient, initDatabase };
