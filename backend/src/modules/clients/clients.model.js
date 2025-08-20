const pool = require('../../config/db');

function validateClientData(clientData) {
  const {
    is_company = true,
    legal_name,
    firstname,
    lastname,
    siret,
    country_code = 'FR',
    email,
    phone
  } = clientData;

  // Validation type client
  if (is_company) {
    if (!legal_name) throw new Error('Le nom légal est requis pour une entreprise');
    if (country_code === 'FR') {
      if (!siret) throw new Error('Le SIRET est requis pour une entreprise française');
      if (!/^\d{14}$/.test(siret)) throw new Error('Le SIRET doit contenir 14 chiffres');
    }
  } else {
    if (!firstname || !lastname) throw new Error('Le prénom et le nom sont requis pour un particulier');
    if (siret) throw new Error('Un particulier ne peut pas avoir de SIRET');
  }

  // Country code ISO
  if (!/^[A-Z]{2}$/.test(country_code)) throw new Error('Le code pays doit être au format ISO 2 lettres');

  // Email simple
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email invalide');

  // Phone simple
  if (phone && !/^[0-9 +()-]{5,30}$/.test(phone)) throw new Error('Numéro de téléphone invalide');
}

// ----------------- Get all clients -----------------
async function getAllClients() {
  const result = await pool.query(
    `SELECT id, is_company, legal_name, firstname, lastname, siret, legal_identifier,
            address, city, postal_code, country_code, vat_number, email, phone,
            created_at, updated_at
     FROM invoicing.clients`
  );
  return result.rows;
}

// ----------------- Insert client -----------------
async function insertClient(clientData) {
  validateClientData(clientData);

  const {
    is_company = true,
    legal_name,
    firstname,
    lastname,
    siret,
    legal_identifier,
    address,
    city,
    postal_code,
    country_code = 'FR',
    vat_number,
    email,
    phone
  } = clientData;

  const result = await pool.query(
    `INSERT INTO invoicing.clients
      (is_company, legal_name, firstname, lastname, siret, legal_identifier,
       address, city, postal_code, country_code, vat_number, email, phone)
     VALUES ($1, $2, $3, $4, 
             CASE WHEN $6 = 'FR' THEN REPLACE($5, ' ', '') ELSE $5 END,
             CASE WHEN $6 = 'FR' THEN REPLACE($6, ' ', '') ELSE $6 END,
             $7, $8, $9, $10, $11, $12, $13)
     RETURNING *`,
    [
      is_company,
      legal_name,
      firstname,
      lastname,
      siret,
      legal_identifier,
      address,
      city,
      postal_code,
      country_code,
      vat_number,
      email,
      phone
    ]
  );

  return result.rows[0];
}

// ----------------- Get client by ID -----------------
async function getClientById(id) {
  const result = await pool.query(
    'SELECT * FROM invoicing.clients WHERE id = $1',
    [id]
  );
  return result.rows[0];
}

// ----------------- Remove client -----------------
async function removeClient(id) {
  const result = await pool.query(
    'DELETE FROM invoicing.clients WHERE id = $1 RETURNING *',
    [id]
  );
  if (result.rowCount === 0) {
    throw new Error('Client not found');
  }
  return result.rows[0];
}

// ----------------- Update client -----------------
async function updateClient(id, clientData) {
  validateClientData(clientData);
  
  const {
    is_company = true,
    legal_name,
    firstname,
    lastname,
    siret,
    legal_identifier,
    address,
    city,
    postal_code,
    country_code = 'FR',
    vat_number,
    email,
    phone
  } = clientData;

  const result = await pool.query(
    `UPDATE invoicing.clients
     SET is_company = $1,
         legal_name = $2,
         firstname = $3,
         lastname = $4,
         siret = CASE WHEN $10 = 'FR' THEN REPLACE($5, ' ', '') ELSE $5 END,
         legal_identifier = $6,
         address = $7,
         city = $8,
         postal_code = $9,
         country_code = $10,
         vat_number = $11,
         email = $12,
         phone = $13,
         updated_at = NOW()
     WHERE id = $14
     RETURNING *`,
    [
      is_company,
      legal_name,
      firstname,
      lastname,
      siret,
      legal_identifier,
      address,
      city,
      postal_code,
      country_code,
      vat_number,
      email,
      phone,
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
