const pool = require('../../config/db');
const { encrypt } = require('../../utils/encryption');
const SCHEMA = process.env.DB_SCHEMA || 'public';

/* --- Récupérer tous les vendeurs (sans SMTP) --- */
async function getAllSellers() {
  const result = await pool.query(
    `SELECT id, legal_name, legal_identifier, address, city, postal_code, country_code, 
            vat_number, registration_info, share_capital, iban, bic, contact_email, phone_number,
            company_type, payment_method, payment_terms, additional_1, additional_2,
            created_at, updated_at 
     FROM ${SCHEMA}.sellers`
  );
  return result.rows;
}

/* --- Créer un vendeur + config SMTP associée --- */
async function insertSeller(sellerData, auth0_id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

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
      additional_2,
      smtp_host,
      smtp_port,
      smtp_secure,
      smtp_user,
      smtp_pass,
      smtp_from
    } = sellerData;

    // Création du vendeur
    const sellerResult = await client.query(
      `INSERT INTO ${SCHEMA}.sellers
        (legal_name, legal_identifier, address, city, postal_code, country_code, 
         vat_number, registration_info, share_capital, iban, bic, contact_email, phone_number, 
         company_type, payment_method, payment_terms, additional_1, additional_2, auth0_id)
       VALUES (
         $1, 
         CASE WHEN $6 = 'FR' THEN REPLACE($2, ' ', '') ELSE $2 END,
         $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19
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
        auth0_id
      ]
    );

    const seller = sellerResult.rows[0];

    // Insertion SMTP si présente
    if (smtp_host && smtp_user) {
      const encryptedPass = smtp_pass ? encrypt(smtp_pass) : null;

      await client.query(
        `INSERT INTO ${SCHEMA}.seller_smtp_settings
          (seller_id, smtp_host, smtp_port, smtp_secure, smtp_user, smtp_pass, smtp_from, active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
        [seller.id, smtp_host, smtp_port || 587, smtp_secure || false, smtp_user, encryptedPass, smtp_from]
      );
    }

    await client.query('COMMIT');
    return seller;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/* --- Récupérer un vendeur avec sa config SMTP --- */
async function getSellerById(id) {
  const result = await pool.query(
    `SELECT s.*, smtp.smtp_host, smtp.smtp_port, smtp.smtp_secure, smtp.smtp_user, smtp.smtp_from, smtp.active, smtp.smtp_pass
     FROM ${SCHEMA}.sellers s
     LEFT JOIN ${SCHEMA}.seller_smtp_settings smtp ON s.id = smtp.seller_id
     WHERE s.id = $1`,
    [id]
  );

  const seller = result.rows[0];
  if (!seller) return null;

  // Ne jamais renvoyer le mot de passe réel au front
  seller.smtp_pass = '';

  return seller;
}

/* --- Supprimer un vendeur et sa config SMTP --- */
async function removeSeller(id) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`DELETE FROM ${SCHEMA}.seller_smtp_settings WHERE seller_id = $1`, [id]);
    const result = await client.query(`DELETE FROM ${SCHEMA}.sellers WHERE id = $1 RETURNING *`, [id]);
    if (result.rowCount === 0) throw new Error('Seller not found');
    await client.query('COMMIT');
    return result.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function updateSeller(id, data) {
  const client = await pool.connect();
  try {
    console.log('[updateSeller] START id:', id);
    console.log('[updateSeller] incoming data:', data);

    await client.query('BEGIN');

    const {
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_pass,
      smtp_secure,
      smtp_from,
      active: smtp_active,
      seller_id,
      ...mainData
    } = data;

    const sellerDbId = seller_id || id;

    console.log('[updateSeller] mainData:', mainData);
    console.log('[updateSeller] SMTP data:', { smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, smtp_from });
    console.log('[updateSeller] sellerDbId:', sellerDbId);

    // --- Mise à jour des données principales
    const query = `
      UPDATE ${SCHEMA}.sellers
      SET legal_name = $1,
          legal_identifier = $2,
          address = $3,
          city = $4,
          postal_code = $5,
          country_code = $6,
          vat_number = $7,
          registration_info = $8,
          share_capital = $9,
          phone_number = $10,
          contact_email = $11,
          updated_at = NOW()
      WHERE id = $12
      RETURNING *;
    `;
    const values = [
      mainData.legal_name,
      mainData.legal_identifier,
      mainData.address,
      mainData.city,
      mainData.postal_code,
      mainData.country_code,
      mainData.vat_number,
      mainData.registration_info,
      mainData.share_capital,
      mainData.phone_number,
      mainData.contact_email,
      sellerDbId
    ];

    const { rows } = await client.query(query, values);
    if (!rows[0]) throw new Error(`[updateSeller] Seller with id ${sellerDbId} not found`);
    const updatedSeller = rows[0];
    console.log('[updateSeller] updatedSeller:', updatedSeller);

    // --- Gestion du bloc SMTP sécurisé
    if (smtp_host || smtp_user || smtp_pass || smtp_from) {
      console.log('[updateSeller] checking existing SMTP settings...');
      const existingRes = await client.query(
        `SELECT * FROM ${SCHEMA}.seller_smtp_settings WHERE seller_id = $1 FOR UPDATE`,
        [sellerDbId]
      );
      const existing = existingRes.rows[0];

      // encode seulement si un nouveau mot de passe est fourni
      let encryptedPass = null;
      if (smtp_pass && smtp_pass !== '') {
        encryptedPass = encrypt(smtp_pass);
      }

      if (existing) {
        console.log('[updateSeller] updating existing SMTP settings...');
        await client.query(
          `
          UPDATE ${SCHEMA}.seller_smtp_settings
          SET smtp_host = $1,
              smtp_port = $2,
              smtp_user = $3,
              smtp_pass = COALESCE($4, smtp_pass),
              smtp_secure = $5,
              smtp_from = $6,
              active = $7,
              updated_at = NOW()
          WHERE seller_id = $8
          `,
          [
            smtp_host || existing.smtp_host,
            smtp_port || existing.smtp_port || 587,
            smtp_user || existing.smtp_user,
            encryptedPass, // null si pas de nouveau mot de passe
            smtp_secure ?? existing.smtp_secure ?? false,
            smtp_from || existing.smtp_from,
            smtp_active ?? existing.active ?? true,
            sellerDbId
          ]
        );
      } else {
        console.log('[updateSeller] inserting new SMTP settings...');
        await client.query(
          `
          INSERT INTO ${SCHEMA}.seller_smtp_settings
          (seller_id, smtp_host, smtp_port, smtp_user, smtp_pass, smtp_secure, smtp_from, active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `,
          [
            sellerDbId,
            smtp_host,
            smtp_port || 587,
            smtp_user,
            encryptedPass, // encode si fourni, sinon null
            smtp_secure || false,
            smtp_from,
            smtp_active ?? true
          ]
        );
      }
    }

    await client.query('COMMIT');
    console.log('[updateSeller] COMMIT successful');
    return updatedSeller;
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[updateSeller] ROLLBACK due to error:', err);
    throw err;
  } finally {
    client.release();
    console.log('[updateSeller] connection released');
  }
}

module.exports = {
  getAllSellers,
  insertSeller,
  getSellerById,
  removeSeller,
  updateSeller
};
