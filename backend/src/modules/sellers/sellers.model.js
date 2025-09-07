const pool = require('../../config/db');

async function getAllSellers() {
  const result = await pool.query(
    `SELECT id, legal_name, legal_identifier, address, city, postal_code, country_code, 
            vat_number, registration_info, share_capital, iban, bic, contact_email, phone_number,
            company_type, payment_method, payment_terms, additional_1, additional_2,
            created_at, updated_at 
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
    iban,
    bic,
    contact_email,
    phone_number,
    company_type,
    payment_method,
    payment_terms,
    additional_1,
    additional_2
  } = sellerData;

  share_capital = share_capital === '' ? null : Number(share_capital);

  const result = await pool.query(
    `INSERT INTO invoicing.sellers
      (legal_name, legal_identifier, address, city, postal_code, country_code, 
       vat_number, registration_info, share_capital, iban, bic, contact_email, phone_number, 
       company_type, payment_method, payment_terms, additional_1, additional_2)
     VALUES (
       $1, 
       CASE WHEN $6 = 'FR' THEN REPLACE($2, ' ', '') ELSE $2 END,
       $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
     )
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
      iban,
      bic,
      contact_email,
      phone_number,
      company_type,
      payment_method,
      payment_terms,
      additional_1,
      additional_2
    ]
  );

  return result.rows[0];
}

async function getSellerById(id) {
  const result = await pool.query('SELECT * FROM invoicing.sellers WHERE id = $1', [id]);
  return result.rows[0]; 
}

async function removeSeller(id) {
  const result = await pool.query(
    'DELETE FROM invoicing.sellers WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) {
    throw new Error('Seller not found');
  }
  return result.rows[0];
}

async function updateSeller(id, sellerData) {
  const {
    legal_name,
    legal_identifier,
    address,
    city,
    postal_code,
    country_code,
    vat_number,
    registration_info,
    share_capital,
    iban,
    bic,
    contact_email,
    phone_number,
    company_type,
    payment_method,
    payment_terms,
    additional_1,
    additional_2
  } = sellerData;

  const result = await pool.query(
    `UPDATE invoicing.sellers
     SET legal_name = $1,
         legal_identifier = CASE WHEN country_code = 'FR' THEN REPLACE($2, ' ', '') ELSE $2 END,
         address = $3,
         city = $4,
         postal_code = $5,
         country_code = $6,
         vat_number = $7,
         registration_info = $8,
         share_capital = $9,
         iban = $10,
         bic = $11,
         contact_email = $12,
         phone_number = $13,
         company_type = $14,
         payment_method = $15,
         payment_terms = $16,
         additional_1 = $17,
         additional_2 = $18,
         updated_at = NOW()
     WHERE id = $19
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
      share_capital === '' ? null : Number(share_capital),
      iban,
      bic,
      contact_email,
      phone_number,
      company_type,
      payment_method,
      payment_terms,
      additional_1,
      additional_2,
      id
    ]
  );

  if (result.rowCount === 0) {
    throw new Error('Seller not found');
  }

  return result.rows[0];
}

module.exports = {
  getAllSellers,
  insertSeller,
  getSellerById,
  removeSeller,
  updateSeller
};
