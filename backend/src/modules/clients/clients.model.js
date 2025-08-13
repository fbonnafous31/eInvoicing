const pool = require('../../config/db');

async function getAllClients() {
  const result = await pool.query(
    `SELECT id, legal_name, legal_identifier, address, city, postal_code, country_code, 
            vat_number, created_at, updated_at 
     FROM invoicing.clients`
  );
  return result.rows;
}

async function insertClient(clientData) {
  let {
    legal_name,
    legal_identifier,
    address,
    city,
    postal_code,
    country_code,
    vat_number
  } = clientData;

  const result = await pool.query(
    `INSERT INTO invoicing.clients
      (legal_name, legal_identifier, address, city, postal_code, country_code, vat_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      legal_name,
      legal_identifier,
      address,
      city,
      postal_code,
      country_code,
      vat_number
    ]
  );

  return result.rows[0];
}

async function getClientById(id) {
  const result = await pool.query('SELECT * FROM invoicing.clients WHERE id = $1', [id]);
  return result.rows[0]; 
}

async function removeClient(id) {
  const result = await pool.query(
    'DELETE FROM invoicing.clients WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) {
    throw new Error('clients not found');
  }
  return result.rows[0]; 
}

async function updateClient(id, clientData) {
  const {
    legal_name,
    legal_identifier,
    address,
    city,
    postal_code,
    country_code,
    vat_number
  } = clientData;

  const result = await pool.query(
    `UPDATE invoicing.clients
     SET legal_name = $1,
         legal_identifier = CASE WHEN country_code = 'FR' THEN REPLACE($2, ' ', '') ELSE $2 END,
         address = $3,
         city = $4,
         postal_code = $5,
         country_code = $6,
         vat_number = $7,
         updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      legal_name,
      legal_identifier,
      address,
      city,
      postal_code,
      country_code,
      vat_number,
      id
    ]
  );

  if (result.rowCount === 0) {
    throw new Error('Client not found');
  }

  return result.rows[0];
}

module.exports = {
  getAllClients,
  insertClient,
  getClientById,
  removeClient,
  updateClient
};
