const pool = require('../../config/db');

/**
 * Récupère toutes les factures avec leurs lignes, taxes et justificatifs
 */
async function getAllInvoices() {
  const invoicesResult = await pool.query(
    `SELECT * FROM invoicing.invoices ORDER BY created_at DESC`
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

    // --- Remplir seller_legal_name ---
    if (invoice.seller_id && !invoice.seller_legal_name) {
      const sellerRes = await client.query(
        'SELECT legal_name FROM invoicing.sellers WHERE id = $1',
        [invoice.seller_id]
      );
      invoice.seller_legal_name = sellerRes.rows[0]?.legal_name || null;
    }

    // --- Remplir les infos client depuis client_id ---
    if (invoice.client_id) {
      const clientRes = await client.query(
        `SELECT legal_name, first_name, last_name, siret, vat_number, address, type
         FROM invoicing.clients WHERE id = $1`,
        [invoice.client_id]
      );
      const c = clientRes.rows[0];
      invoice.client_legal_name = c.legal_name;
      invoice.client_first_name = c.first_name;
      invoice.client_last_name = c.last_name;
      invoice.client_siret = c.siret;
      invoice.client_vat_number = c.vat_number;
      invoice.client_address = c.address;
      invoice.client_type = c.type;
    }

    // --- Validation invoice_number ---
    if (!invoice.invoice_number) throw new Error('invoice_number obligatoire');
    invoice.invoice_number = invoice.invoice_number.trim().slice(0, 20);

    // --- Validation fiscal_year ---
    if (!invoice.fiscal_year) invoice.fiscal_year = new Date(invoice.issue_date).getFullYear();
    const issueYear = new Date(invoice.issue_date).getFullYear();
    const fy = invoice.fiscal_year;
    if (fy < issueYear - 1 || fy > issueYear + 1)
      throw new Error(`Exercice fiscal invalide : ${fy} pour une date d'émission ${invoice.issue_date}`);

    // --- Validation des informations client selon type ---
    switch(invoice.client_type) {
      case 'individual':
        if (!invoice.client_first_name || !invoice.client_last_name || !invoice.client_address)
          throw new Error('Informations client manquantes pour un particulier');
        break;
      case 'company_fr':
        if (!invoice.client_legal_name || !invoice.client_siret || !invoice.client_address)
          throw new Error('Informations client manquantes pour une entreprise française');
        break;
      case 'company_eu':
        if (!invoice.client_legal_name || !invoice.client_vat_number || !invoice.client_address)
          throw new Error('Informations client manquantes pour une entreprise UE');
        break;
      default:
        throw new Error('Type de client inconnu');
    }

    // --- Vérification unicité seller + fiscal_year + invoice_number ---
    const existing = await client.query(
      `SELECT id 
       FROM invoicing.invoices 
       WHERE seller_id = $1 AND fiscal_year = $2 AND invoice_number = $3`,
      [invoice.seller_id, invoice.fiscal_year, invoice.invoice_number]
    );
    if (existing.rows.length > 0) {
      throw new Error(
        `Une facture avec le même numéro ${invoice.invoice_number} pour ce vendeur et cet exercice existe déjà`
      );
    }

    // --- Vérification attachments ---
    const mainAttachments = attachments.filter(a => a.attachment_type === 'main');
    if (mainAttachments.length !== 1) throw new Error('Une facture doit avoir un justificatif principal.');

    // --- Préparer insertion invoice ---
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

    // --- Insertion lignes ---
    for (const line of lines) {
      const cols = Object.keys(line).join(', ');
      const vals = Object.values(line);
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      await client.query(
        `INSERT INTO invoicing.invoice_lines (${cols}, invoice_id) VALUES (${placeholders}, $${vals.length + 1})`,
        [...vals, invoiceId]
      );
    }

    // --- Insertion taxes ---
    for (const tax of taxes) {
      const cols = Object.keys(tax).join(', ');
      const vals = Object.values(tax);
      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      await client.query(
        `INSERT INTO invoicing.invoice_taxes (${cols}, invoice_id) VALUES (${placeholders}, $${vals.length + 1})`,
        [...vals, invoiceId]
      );
    }

    // --- Insertion attachments ---
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
