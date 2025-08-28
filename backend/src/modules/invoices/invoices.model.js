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
  // 1. Récupère la facture principale
  const invoiceResult = await pool.query('SELECT * FROM invoicing.invoices WHERE id = $1', [id]);
  if (invoiceResult.rows.length === 0) return null;
  const invoice = invoiceResult.rows[0];

  // 2. Récupère les lignes, taxes, attachments
  const [linesResult, taxesResult, attachmentsResult, clientResult] = await Promise.all([
    pool.query('SELECT * FROM invoicing.invoice_lines WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_taxes WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_attachments WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_client WHERE invoice_id = $1', [id])
  ]);

  // 3. Prépare l'objet client
  const client = clientResult.rows[0] || null;

  return {
    ...invoice,
    lines: linesResult.rows,
    taxes: taxesResult.rows,
    attachments: attachmentsResult.rows,
    client: client
  };
}

/**
 * Crée une facture avec lignes, taxes et justificatifs
 */
async function createInvoice({ invoice, client, lines = [], taxes = [], attachments = [] }) {
  const conn = await pool.connect();

  try {
    await conn.query('BEGIN');

    // --- Remplir seller_legal_name ---
    if (invoice.seller_id && !invoice.seller_legal_name) {
      const sellerRes = await conn.query(
        'SELECT legal_name FROM invoicing.sellers WHERE id = $1',
        [invoice.seller_id]
      );
      invoice.seller_legal_name = sellerRes.rows[0]?.legal_name || null;
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

    // --- Vérification unicité seller + fiscal_year + invoice_number ---
    const existing = await conn.query(
      `SELECT id 
       FROM invoicing.invoices 
       WHERE seller_id = $1 AND fiscal_year = $2 AND invoice_number = $3`,
      [invoice.seller_id, invoice.fiscal_year, invoice.invoice_number]
    );
    if (existing.rows.length > 0)
      throw new Error(`Une facture avec le même numéro ${invoice.invoice_number} pour ce vendeur et cet exercice existe déjà`);

    // --- Vérification attachments ---
    const mainAttachments = attachments.filter(a => a.attachment_type === 'main');
    if (mainAttachments.length !== 1) throw new Error('Une facture doit avoir un justificatif principal.');

    // --- Insertion facture ---
    const invoiceColumns = [
      "invoice_number",
      "issue_date",
      "fiscal_year",
      "seller_id",
      "seller_legal_name",
      "contract_number",
      "purchase_order_number",
      "payment_terms",      
      "client_id"
    ];
    const invoiceValues = invoiceColumns.map(col => invoice[col] || null);
    const placeholders = invoiceColumns.map((_, i) => `$${i + 1}`).join(", ");
    const invoiceRes = await conn.query(
      `INSERT INTO invoicing.invoices (${invoiceColumns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      invoiceValues
    );
    const invoiceId = invoiceRes.rows[0].id;

    // --- Insertion client ---
    if (client) {
      await conn.query(
        `INSERT INTO invoicing.invoice_client 
        (invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          invoiceId,
          client.client_legal_name || `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim(),
          client.client_siret ? 'SIRET' : client.client_vat_number ? 'VAT' : 'NAME',
          client.client_siret || client.client_vat_number || `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim(),
          client.client_address || null,
          client.client_city || null,
          client.client_postal_code || null,
          client.client_country_code || null
        ]
      );
    }

    // --- Insertion lignes, taxes, attachments en parallèle ---
    await Promise.all([
      ...lines.map(line => {
        const cols = Object.keys(line).join(', ');
        const vals = Object.values(line);
        const placeholdersLine = vals.map((_, i) => `$${i + 1}`).join(', ');
        return conn.query(
          `INSERT INTO invoicing.invoice_lines (${cols}, invoice_id) VALUES (${placeholdersLine}, $${vals.length + 1})`,
          [...vals, invoiceId]
        );
      }),
      ...taxes.map(tax => {
        const cols = Object.keys(tax).join(', ');
        const vals = Object.values(tax);
        const placeholdersTax = vals.map((_, i) => `$${i + 1}`).join(', ');
        return conn.query(
          `INSERT INTO invoicing.invoice_taxes (${cols}, invoice_id) VALUES (${placeholdersTax}, $${vals.length + 1})`,
          [...vals, invoiceId]
        );
      }),
      ...attachments.map(att => {
        const cols = Object.keys(att).join(', ');
        const vals = Object.values(att);
        const placeholdersAtt = vals.map((_, i) => `$${i + 1}`).join(', ');
        return conn.query(
          `INSERT INTO invoicing.invoice_attachments (${cols}, invoice_id) VALUES (${placeholdersAtt}, $${vals.length + 1})`,
          [...vals, invoiceId]
        );
      })
    ]);

    await conn.query('COMMIT');
    return await getInvoiceById(invoiceId);

  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Supprime une facture par ID
 */
async function deleteInvoice(id) {
  const result = await pool.query('DELETE FROM invoicing.invoices WHERE id = $1 RETURNING *', [id]);
  return result.rows[0] || null;
}

/**
 * Met à jour une facture complète (facture, client, lignes, taxes, attachments)
 * dans une seule transaction.
 */
async function updateInvoice(id, { invoice, client, lines, taxes, attachments }) {
  const conn = await pool.connect();
  try {
    await conn.query('BEGIN');

    // 1. Mettre à jour la facture principale
    if (invoice) {
      const invoiceColumns = [
        "invoice_number",
        "issue_date",
        "fiscal_year",
        "seller_id",
        "contract_number",
        "purchase_order_number",
        "payment_terms",
        "subtotal",
        "total_taxes",
        "total"
      ];
      const updates = invoiceColumns
        .filter(col => invoice[col] !== undefined)
        .map((col, i) => `${col} = $${i + 2}`);
      const values = invoiceColumns
        .filter(col => invoice[col] !== undefined)
        .map(col => invoice[col]);

      if (updates.length > 0) {
        const query = `UPDATE invoicing.invoices SET ${updates.join(', ')} WHERE id = $1`;
        await conn.query(query, [id, ...values]);
      }
    }

    // 2. Mettre à jour le client de la facture
    if (client) {
      if (client.client_id) {
        await conn.query('UPDATE invoicing.invoices SET client_id = $1 WHERE id = $2', [client.client_id, id]);
      }

      const clientExistsResult = await conn.query('SELECT id FROM invoicing.invoice_client WHERE invoice_id = $1', [id]);
      
      const legal_name = client.client_legal_name || `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim();
      const legal_identifier_type = client.client_siret ? 'SIRET' : client.client_vat_number ? 'VAT' : 'NAME';
      const legal_identifier = client.client_siret || client.client_vat_number || legal_name;

      if (clientExistsResult.rows.length > 0) {
        await conn.query(
          `UPDATE invoicing.invoice_client 
           SET legal_name = $2, legal_identifier_type = $3, legal_identifier = $4, address = $5, city = $6, postal_code = $7, country_code = $8
           WHERE invoice_id = $1`,
          [id, legal_name, legal_identifier_type, legal_identifier, client.client_address, client.client_city, client.client_postal_code, client.client_country_code]
        );
      } else if (legal_name) { // n'insère que si on a des données client
        await conn.query(
          `INSERT INTO invoicing.invoice_client (invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [id, legal_name, legal_identifier_type, legal_identifier, client.client_address, client.client_city, client.client_postal_code, client.client_country_code]
        );
      }
    }

    // 3. Mettre à jour les lignes, taxes, attachments (stratégie: tout supprimer puis réinsérer)
    await conn.query('DELETE FROM invoicing.invoice_lines WHERE invoice_id = $1', [id]);
    if (lines && lines.length > 0) {
      for (const line of lines) {
        // On exclut id ET invoice_id des données de la ligne pour éviter la duplication
        const { id: lineId, invoice_id, ...lineData } = line;
        const cols = Object.keys(lineData).join(', ');
        const vals = Object.values(lineData);
        const placeholdersLine = vals.map((_, i) => `$${i + 1}`).join(', ');
        await conn.query(`INSERT INTO invoicing.invoice_lines (${cols}, invoice_id) VALUES (${placeholdersLine}, $${vals.length + 1})`, [...vals, id]);
      }
    }

    await conn.query('DELETE FROM invoicing.invoice_taxes WHERE invoice_id = $1', [id]);
    if (taxes && taxes.length > 0) {
      for (const tax of taxes) {
        // On exclut id ET invoice_id des données de la taxe
        const { id: taxId, invoice_id, ...taxData } = tax;
        const cols = Object.keys(taxData).join(', ');
        const vals = Object.values(taxData);
        const placeholdersTax = vals.map((_, i) => `$${i + 1}`).join(', ');
        await conn.query(`INSERT INTO invoicing.invoice_taxes (${cols}, invoice_id) VALUES (${placeholdersTax}, $${vals.length + 1})`, [...vals, id]);
      }
    }

    await conn.query('DELETE FROM invoicing.invoice_attachments WHERE invoice_id = $1', [id]);
    if (attachments && attachments.length > 0) {
      for (const att of attachments) {
        // On exclut id ET invoice_id des données du justificatif
        const { id: attId, invoice_id, ...attData } = att;
        const cols = Object.keys(attData).join(', ');
        const vals = Object.values(attData);
        const placeholdersAtt = vals.map((_, i) => `$${i + 1}`).join(', ');
        await conn.query(`INSERT INTO invoicing.invoice_attachments (${cols}, invoice_id) VALUES (${placeholdersAtt}, $${vals.length + 1})`, [...vals, id]);
      }
    }

    await conn.query('COMMIT');
    return await getInvoiceById(id);
  } catch (err) {
    await conn.query('ROLLBACK');
    throw err;
  } finally {
    conn.release();
  }
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice
};
