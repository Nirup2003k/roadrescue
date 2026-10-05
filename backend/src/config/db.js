const { Pool, types } = require('pg');
require('dotenv').config();

types.setTypeParser(20, (val) => parseInt(val, 10)); // BIGINT (COUNT)
types.setTypeParser(1700, (val) => parseFloat(val)); // NUMERIC/DECIMAL (AVG, SUM, base_price)

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 10,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[db] PostgreSQL connection established');
  } catch (err) {
    console.error('[db] Failed to connect to PostgreSQL:', err.message);
    throw err;
  }
}

module.exports = { pool, testConnection };
