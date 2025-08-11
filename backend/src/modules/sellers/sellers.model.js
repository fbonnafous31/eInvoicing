const pool = require('../../config/db');

async function getAllSellers() {
  const result = await pool.query(
    'SELECT id, legal_name, city FROM sellers ORDER BY legal_name ASC'
  );
  return result.rows;
}

module.exports = { getAllSellers };
