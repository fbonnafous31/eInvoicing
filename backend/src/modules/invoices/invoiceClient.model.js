const pool = require("../../config/db.js");

/**
 * InvoiceClient Model
 * Représente les informations client rattachées à une facture
 */
const InvoiceClientModel = {
  create: async function(invoiceId, data) {
    const query = `
      INSERT INTO invoicing.invoice_client 
        (invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code, email, phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;

    const values = [
      invoiceId,
      data.legal_name,
      data.legal_identifier_type,
      data.legal_identifier,
      data.address || null,
      data.city || null,
      data.postal_code || null,
      data.country_code || null,
      data.email || null,
      data.phone || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  findByInvoiceId: async function(invoiceId) {
    const query = `
      SELECT * 
      FROM invoicing.invoice_client
      WHERE invoice_id = $1;
    `;
    const result = await pool.query(query, [invoiceId]);
    return result.rows[0];
  },

  update: async function(invoiceId, data) {
    const query = `
      UPDATE invoicing.invoice_client
      SET legal_name = $2,
          legal_identifier_type = $3,
          legal_identifier = $4,
          address = $5,
          city = $6,
          postal_code = $7,
          country_code = $8
      WHERE invoice_id = $1
      RETURNING *;
    `;

    const values = [
      invoiceId,
      data.legal_name,
      data.legal_identifier_type,
      data.legal_identifier,
      data.address || null,
      data.city || null,
      data.postal_code || null,
      data.country_code || null,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  },

  delete: async function(invoiceId) {
    const query = `
      DELETE FROM invoicing.invoice_client
      WHERE invoice_id = $1;
    `;
    await pool.query(query, [invoiceId]);
    return true;
  },
};

module.exports = InvoiceClientModel;
