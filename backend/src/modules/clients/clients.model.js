const pool = require('../../config/db');
const SCHEMA = process.env.DB_SCHEMA || 'public';

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

  if (!/^[A-Z]{2}$/.test(country_code)) throw new Error('Le code pays doit être au format ISO 2 lettres');
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email invalide');
  if (phone && !/^[0-9 +()-]{5,30}$/.test(phone)) throw new Error('Numéro de téléphone invalide');
}

// ----------------- Vérification unicité SIRET -----------------
async function checkSiretUnique(siret, clientId = null) {
  if (!siret) return;
  const cleaned = siret.replace(/\D/g, '');
  let query = `SELECT id FROM ${SCHEMA}.clients WHERE siret = $1`;
  const params = [cleaned];

  if (clientId) {
    query += ' AND id <> $2';
    params.push(clientId);
  }

  const res = await pool.query(query, params);
  if (res.rowCount > 0) {
    throw new Error('Ce SIRET est déjà utilisé par un autre client');
  }
}

// ----------------- Get all clients -----------------
async function getAllClients() {
  const result = await pool.query(
    `SELECT id, is_company, legal_name, firstname, lastname, siret, legal_identifier,
            address, city, postal_code, country_code, vat_number, email, phone,
            created_at, updated_at
     FROM ${SCHEMA}.clients
     ORDER BY legal_name`
  );
  return result.rows;
}

// ----------------- Get clients by seller -----------------
async function getClientsBySeller(sellerId) {
  const result = await pool.query(
    `SELECT id, is_company, legal_name, firstname, lastname, siret, legal_identifier,
            address, city, postal_code, country_code, vat_number, email, phone,
            created_at, updated_at
     FROM ${SCHEMA}.clients
     WHERE seller_id = $1
     ORDER BY legal_name`,
    [sellerId]
  );
  return result.rows;
}

// ----------------- Get client by ID -----------------
async function getClientById(id, sellerId) {
  const result = await pool.query(
    `SELECT * FROM ${SCHEMA}.clients WHERE id = $1 AND seller_id = $2`,
    [id, sellerId]
  );
  return result.rows[0];
}

// ----------------- Insert client -----------------
async function insertClient(clientData, sellerId) {
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

  if (is_company && country_code === 'FR') {
    await checkSiretUnique(siret);
  }

  const cleanedSiret = country_code === 'FR' && siret ? siret.replace(/\D/g, '') : siret;

  const result = await pool.query(
    `INSERT INTO ${SCHEMA}.clients
      (is_company, legal_name, firstname, lastname, siret, legal_identifier,
       address, city, postal_code, country_code, vat_number, email, phone, seller_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING *`,
    [
      is_company,
      legal_name,
      firstname,
      lastname,
      cleanedSiret,
      legal_identifier,
      address,
      city,
      postal_code,
      country_code,
      vat_number,
      email,
      phone,
      sellerId
    ]
  );

  return result.rows[0];
}

// ----------------- Remove client -----------------
async function removeClient(id, sellerId) {
  const result = await pool.query(
    `DELETE FROM ${SCHEMA}.clients WHERE id = $1 AND seller_id = $2 RETURNING *`,
    [id, sellerId]
  );
  if (result.rowCount === 0) throw new Error('Client not found');
  return result.rows[0];
}

// ----------------- Update client -----------------
async function updateClient(id, clientData, sellerId) {
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

  if (is_company && country_code === 'FR') {
    await checkSiretUnique(siret, id);
  }

  const cleanedSiret = country_code === 'FR' && siret ? siret.replace(/\D/g, '') : siret;

  const result = await pool.query(
    `UPDATE ${SCHEMA}.clients
     SET is_company = $1,
         legal_name = $2,
         firstname = $3,
         lastname = $4,
         siret = $5,
         legal_identifier = $6,
         address = $7,
         city = $8,
         postal_code = $9,
         country_code = $10,
         vat_number = $11,
         email = $12,
         phone = $13,
         updated_at = NOW()
     WHERE id = $14 AND seller_id = $15
     RETURNING *`,
    [
      is_company,
      legal_name,
      firstname,
      lastname,
      cleanedSiret,
      legal_identifier,
      address,
      city,
      postal_code,
      country_code,
      vat_number,
      email,
      phone,
      id,
      sellerId
    ]
  );

  if (result.rowCount === 0) throw new Error('Client not found');

  return result.rows[0];
}

module.exports = {
  getAllClients,
  getClientsBySeller,
  getClientById,
  insertClient,
  removeClient,
  updateClient
};
