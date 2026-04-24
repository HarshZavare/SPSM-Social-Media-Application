require('dotenv').config();
const { Client } = require('pg');

async function createDatabase() {
  const defaultClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres', // Connect to default database
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await defaultClient.connect();
    console.log('✅ Connected to PostgreSQL server.');
    
    const dbName = process.env.DB_NAME || 'spsm_db';
    
    // Create the database
    await defaultClient.query(`CREATE DATABASE ${dbName};`);
    console.log(`✅ Database '${dbName}' created successfully.`);
    
  } catch (err) {
    if (err.code === '42P04') { // 42P04 means database already exists
       console.log(`✅ Database already exists.`);
    } else {
       console.error('❌ Failed to create database:', err.message);
    }
  } finally {
    await defaultClient.end();
  }
}

createDatabase();
