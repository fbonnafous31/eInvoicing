const pool = require('../../config/db');

async function getAllSellers() {
  const result = await pool.query(
    `SELECT id, legal_name, legal_identifier, address, city, postal_code, country_code, 
            vat_number, registration_info, share_capital, bank_details, created_at, updated_at 
     FROM invoicing.sellers`
  );
  return result.rows;
}

async function insertSeller(sellerData) {
  let {
    legal_name,
    legal_identifier,
    address,
    city,
    postal_code,
    country_code,
    vat_number,
    registration_info,
    share_capital,
    bank_details,
  } = sellerData;

  share_capital = share_capital === '' ? null : Number(share_capital);

  const result = await pool.query(
    `INSERT INTO invoicing.sellers
      (legal_name, legal_identifier, address, city, postal_code, country_code, vat_number, registration_info, share_capital, bank_details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [
      legal_name,
      legal_identifier,
      address,
      city,
      postal_code,
      country_code,
      vat_number,
      registration_info,
      share_capital,
      bank_details,
    ]
  );

  return result.rows[0];
}

async function getSellerById(id) {
  const result = await pool.query('SELECT * FROM invoicing.sellers WHERE id = $1', [id]);
  return result.rows[0]; 
}

module.exports = {
  getAllSellers,  
  insertSeller,
  getSellerById
};
