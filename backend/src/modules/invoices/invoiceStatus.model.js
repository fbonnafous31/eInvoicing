const pool = require('../../config/db');

/**
 * Met à jour le statut technique et l'ID de soumission d'une facture.
 * @param {number} invoiceId
 * @param {Object} data - { technicalStatus, submissionId }
 */
async function updateTechnicalStatus(invoiceId, { technicalStatus, submissionId }) {
  const query = `
    UPDATE invoicing.invoices
    SET technical_status = $1,
        submission_id = $2,
        last_technical_update = now()
    WHERE id = $3
    RETURNING *;
  `;
  const values = [technicalStatus, submissionId, invoiceId];
  const result = await pool.query(query, values);
  return result.rows[0];
}

/**
 * Met à jour le statut métier courant et stocke dans l'historique.
 * @param {number} invoiceId 
 * @param {Object} data - { statusCode, statusLabel, clientComment? }
 */
async function updateBusinessStatus(invoiceId, data) {
  // 🔹 Mise à jour du statut métier sur la facture
  const queryUpdateInvoice = `
    UPDATE invoicing.invoices
    SET business_status = $1,
        updated_at = now()
    WHERE id = $2
    RETURNING *;
  `;
  const valuesUpdateInvoice = [data.statusCode, invoiceId];
  const { rows } = await pool.query(queryUpdateInvoice, valuesUpdateInvoice);

  // 🔹 Ajout dans l'historique avec éventuellement le commentaire client
  const queryInsertStatus = `
    INSERT INTO invoicing.invoice_status(invoice_id, status_code, status_label, client_comment)
    VALUES ($1, $2, $3, $4)
    RETURNING *;
  `;
  const valuesInsertStatus = [
    invoiceId,
    data.statusCode,
    data.statusLabel,
    data.clientComment || null
  ];
  await pool.query(queryInsertStatus, valuesInsertStatus);

  return rows[0] || null;
}

/**
 * Récupère l'historique des statuts d'une facture, avec commentaires clients.
 */
async function getInvoiceStatusHistory(invoiceId) {
  const query = `
    SELECT id, status_code, status_label, client_comment, created_at
    FROM invoicing.invoice_status
    WHERE invoice_id = $1
    ORDER BY created_at ASC;
  `;
  const { rows } = await pool.query(query, [invoiceId]);
  return rows;
}

/**
 * Récupère le commentaire pour un statut de facture spécifique.
 */
async function getInvoiceStatusComment(invoiceId, statusCode) {
  const query = `
    SELECT client_comment
    FROM invoicing.invoice_status
    WHERE invoice_id = $1 AND status_code = $2
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const { rows } = await pool.query(query, [invoiceId, statusCode]);
  return rows[0]?.client_comment || null;
}

module.exports = {
  updateTechnicalStatus,
  updateBusinessStatus,
  getInvoiceStatusHistory,
  getInvoiceStatusComment,
};
