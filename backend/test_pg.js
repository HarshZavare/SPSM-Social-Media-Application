require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log(`Attempting to connect to PostgreSQL...`);
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`User: ${process.env.DB_USER}`);
  
  // First, let's try connecting to the default 'postgres' database to see if the server is up and credentials are correct
  const defaultClient = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: 'postgres', // connect to default DB first
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  });

  try {
    await defaultClient.connect();
    console.log('\n✅ Successfully connected to the PostgreSQL server!');
    
    // Check if spsm_db exists
    const dbRes = await defaultClient.query("SELECT datname FROM pg_database WHERE datname = $1", [process.env.DB_NAME || 'spsm_db']);
    
    if (dbRes.rows.length === 0) {
      console.log(`\n⚠️ The database '${process.env.DB_NAME || 'spsm_db'}' does not exist.`);
      console.log(`   We should create it and initialize the schema.`);
    } else {
      console.log(`\n✅ The database '${process.env.DB_NAME || 'spsm_db'}' exists.`);
    }
  } catch (err) {
    console.error('\n❌ Failed to connect to PostgreSQL:');
    console.error(`   Error Code: ${err.code}`);
    console.error(`   Message: ${err.message}`);
    if (err.code === 'ECONNREFUSED') {
      console.error('   Hint: The server is still not running or listening on port 5432.');
    } else if (err.code === '28P01') {
      console.error('   Hint: Password authentication failed. Please check the DB_PASSWORD in your .env file.');
    }
  } finally {
    await defaultClient.end();
  }
}

testConnection();
