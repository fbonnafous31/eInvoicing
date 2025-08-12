const pool = require('../../config/db');

async function getAllSellers() {
  const result = await pool.query(
    'SELECT id, legal_name, legal_identifier, address, city, postal_code, country_code, vat_number, registration_info, share_capital, bank_details, created_at, updated_at FROM invoicing.sellers'
  );
  return result.rows;
}

async function insertSeller(sellerData) {
  const { legal_name, legal_identifier } = sellerData;

  const result = await pool.query(
    `INSERT INTO sellers (legal_name, legal_identifier)
     VALUES ($1, $2) RETURNING *`,
    [legal_name, legal_identifier]
  );
  return result.rows[0];
}

module.exports = {
  getAllSellers,
  insertSeller
};
