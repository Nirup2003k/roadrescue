const { pool } = require('../config/db');

function toPositional(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function query(sql, params = []) {
  const result = await pool.query(toPositional(sql), params);
  return result.rows;
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const wrappedClient = {
      query: async (sql, params = []) => {
        const result = await client.query(toPositional(sql), params);
        return result.rows;
      },
    };
    const result = await callback(wrappedClient);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { query, withTransaction };
