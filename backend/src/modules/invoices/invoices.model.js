const pool = require('../../config/db');

/**
 * Récupère toutes les factures avec leurs lignes, taxes et justificatifs
 */
async function getAllInvoices() {
  const invoicesResult = await pool.query(
    `SELECT *
     FROM invoicing.invoices
     ORDER BY created_at DESC`
  );

  const invoices = [];

  for (const invoice of invoicesResult.rows) {
    const [linesResult, taxesResult, attachmentsResult] = await Promise.all([
      pool.query('SELECT * FROM invoicing.invoice_lines WHERE invoice_id = $1', [invoice.id]),
      pool.query('SELECT * FROM invoicing.invoice_taxes WHERE invoice_id = $1', [invoice.id]),
      pool.query('SELECT * FROM invoicing.invoice_attachments WHERE invoice_id = $1', [invoice.id])
    ]);

    invoices.push({
      ...invoice,
      lines: linesResult.rows,
      taxes: taxesResult.rows,
      attachments: attachmentsResult.rows
    });
  }

  return invoices;
}

/**
 * Récupère une facture par son ID
 */
async function getInvoiceById(id) {
  const invoiceResult = await pool.query('SELECT * FROM invoicing.invoices WHERE id = $1', [id]);
  if (invoiceResult.rows.length === 0) return null;

  const invoice = invoiceResult.rows[0];

  const [linesResult, taxesResult, attachmentsResult] = await Promise.all([
    pool.query('SELECT * FROM invoicing.invoice_lines WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_taxes WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_attachments WHERE invoice_id = $1', [id])
  ]);

  return {
    ...invoice,
    lines: linesResult.rows,
    taxes: taxesResult.rows,
    attachments: attachmentsResult.rows
  };
}

/**
 * Crée une facture avec lignes, taxes et justificatifs
 */
async function createInvoice({ invoice, lines = [], taxes = [], attachments = [] }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // --- S'assurer que seller_legal_name et client_legal_name ---
    if (invoice.seller_id && !invoice.seller_legal_name) {
      const sellerRes = await client.query(
        'SELECT legal_name FROM invoicing.sellers WHERE id = $1',
        [invoice.seller_id]
      );
      invoice.seller_legal_name = sellerRes.rows[0]?.legal_name || null;
    }

    if (invoice.client_id && !invoice.client_legal_name) {
      const clientRes = await client.query(
        'SELECT legal_name FROM invoicing.clients WHERE id = $1',
        [invoice.client_id]
      );
      invoice.client_legal_name = clientRes.rows[0]?.legal_name || null;
    }

    // --- Valider invoice_number fourni par l'utilisateur ---
    if (!invoice.invoice_number) {
      throw new Error('invoice_number obligatoire');
    }
    invoice.invoice_number = invoice.invoice_number.trim().slice(0, 20);

    const existing = await client.query(
      'SELECT id FROM invoicing.invoices WHERE invoice_number = $1',
      [invoice.invoice_number]
    );
    if (existing.rows.length > 0) {
      throw new Error(`invoice_number "${invoice.invoice_number}" déjà utilisé`);
    }

    // --- Supprimer le champ id si présent pour éviter les doublons ---
    const invoiceDataToInsert = { ...invoice };
    delete invoiceDataToInsert.id;

    const invoiceColumns = Object.keys(invoiceDataToInsert).join(', ');
    const invoiceValues = Object.values(invoiceDataToInsert);
    const invoicePlaceholders = invoiceValues.map((_, i) => `$${i + 1}`).join(', ');

    const insertInvoiceQuery = `
      INSERT INTO invoicing.invoices (${invoiceColumns})
      VALUES (${invoicePlaceholders})
      RETURNING *`;
    const invoiceResult = await client.query(insertInvoiceQuery, invoiceValues);
    const invoiceId = invoiceResult.rows[0].id;

    // --- Lignes ---
    for (const line of lines) {
      const cols = Object.keys(line).join(', ');
      const vals = Object.values(line);
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      await client.query(
        `INSERT INTO invoicing.invoice_lines (${cols}, invoice_id) VALUES (${placeholders}, $${vals.length + 1})`,
        [...vals, invoiceId]
      );
    }

    // --- Taxes ---
    for (const tax of taxes) {
      const cols = Object.keys(tax).join(', ');
      const vals = Object.values(tax);
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      await client.query(
        `INSERT INTO invoicing.invoice_taxes (${cols}, invoice_id) VALUES (${placeholders}, $${vals.length + 1})`,
        [...vals, invoiceId]
      );
    }

    // --- Attachments ---
    for (const att of attachments) {
      const cols = Object.keys(att).join(', ');
      const vals = Object.values(att);
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      await client.query(
        `INSERT INTO invoicing.invoice_attachments (${cols}, invoice_id) VALUES (${placeholders}, $${vals.length + 1})`,
        [...vals, invoiceId]
      );
    }

    await client.query('COMMIT');
    return await getInvoiceById(invoiceId);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Supprime une facture par ID
 */
async function deleteInvoice(id) {
  const result = await pool.query('DELETE FROM invoicing.invoices WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice
};
