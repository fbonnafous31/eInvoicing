const pool = require('../../config/db');
const path = require('path');
const fs = require('fs');

/**
 * Récupère toutes les factures avec leurs lignes, taxes et justificatifs
 */
async function getAllInvoices() {
  const invoicesResult = await pool.query(
    `SELECT * FROM invoicing.invoices ORDER BY created_at DESC`
  );

  const invoices = [];

  for (const invoice of invoicesResult.rows) {
    const [linesResult, taxesResult, attachmentsResult, clientResult] = await Promise.all([
      pool.query('SELECT * FROM invoicing.invoice_lines WHERE invoice_id = $1', [invoice.id]),
      pool.query('SELECT * FROM invoicing.invoice_taxes WHERE invoice_id = $1', [invoice.id]),
      pool.query('SELECT * FROM invoicing.invoice_attachments WHERE invoice_id = $1', [invoice.id]),
      pool.query('SELECT legal_name FROM invoicing.invoice_client WHERE invoice_id = $1', [invoice.id])
    ]);

    invoices.push({
      ...invoice,
      lines: linesResult.rows,
      taxes: taxesResult.rows,
      attachments: attachmentsResult.rows,
      client_legal_name: clientResult.rows[0]?.legal_name || '' // ici le champ attendu par ta table
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
      "supply_date",
      "payment_terms",      
      "client_id"
    ];
    const invoiceValues = invoiceColumns.map(col => invoice[col] || null);
    const placeholders = invoiceColumns.map((_, i) => `$${i + 1}`).join(", ");

    console.log("Invoice ready to insert:", invoice);
    console.log("Values:", invoiceValues);
    const invoiceRes = await conn.query(
      `INSERT INTO invoicing.invoices (${invoiceColumns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      invoiceValues
    );
    const invoiceId = invoiceRes.rows[0].id;

    // --- Insertion client ---
    if (client) {
      await conn.query(
        `INSERT INTO invoicing.invoice_client 
          (invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code, email, phone)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          invoiceId,
          client.client_legal_name || `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim(),
          client.client_siret ? 'SIRET' : client.client_vat_number ? 'VAT' : 'NAME',
          client.client_siret || client.client_vat_number || `${client.client_first_name || ''} ${client.client_last_name || ''}`.trim(),
          client.client_address || null,
          client.client_city || null,
          client.client_postal_code || null,
          client.client_country_code || null,
          client.client_email || null,
          client.client_phone || null
        ]
      );
    }


    // --- Insertion lignes, taxes, attachments ---
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
      ...attachments.map(async (att) => {
        // 1️⃣ Générer un nom final unique basé sur invoiceId + attachmentId (id temporaire)
        // Pour récupérer un id avant l'insert, on peut faire un INSERT "RETURNING id" avec un nom temporaire très simple
        const tempName = 'temp'; // juste pour pouvoir insérer et récupérer l'id
        const cols = Object.keys(att).join(', ') + ', stored_name';
        const vals = [...Object.values(att), tempName];
        const placeholdersAtt = vals.map((_, i) => `$${i + 1}`).join(', ');

        const result = await conn.query(
          `INSERT INTO invoicing.invoice_attachments (${cols}, invoice_id) VALUES (${placeholdersAtt}, $${vals.length + 1}) RETURNING id`,
          [...vals, invoiceId]
        );

        const attachmentId = result.rows[0].id;

        // 2️⃣ Nom final simple et unique
        const finalName = `${invoiceId}_${attachmentId}_${att.file_name.replace(/\s+/g, '_')}`;
        const uploadDir = path.join(__dirname, '../../uploads/invoices');
        const finalPath = path.join(uploadDir, finalName);

        // 3️⃣ Renommer le fichier sur le disque
        await fs.promises.rename(att.file_path, finalPath);

        // 4️⃣ Mettre à jour DB avec le nom final
        await conn.query(
          `UPDATE invoicing.invoice_attachments SET stored_name = $1, file_path = $2 WHERE id = $3`,
          [finalName, finalPath, attachmentId]
        );
        // 5️⃣ Supprimer le fichier temporaire si jamais il reste (sécurité)
        if (fs.existsSync(att.file_path)) {
          await fs.promises.unlink(att.file_path);
        }    
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
        "supply_date",
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
          SET legal_name = $2,
              legal_identifier_type = $3,
              legal_identifier = $4,
              address = $5,
              city = $6,
              postal_code = $7,
              country_code = $8,
              email = $9,
              phone = $10
          WHERE invoice_id = $1`,
          [
            id,
            legal_name,
            legal_identifier_type,
            legal_identifier,
            client.client_address,
            client.client_city,
            client.client_postal_code,
            client.client_country_code,
            client.client_email || null,
            client.client_phone || null
          ]
        );
      } else if (legal_name) { // n'insère que si on a des données client
        await conn.query(
          `INSERT INTO invoicing.invoice_client 
            (invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code, email, phone)
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [
            id,
            legal_name,
            legal_identifier_type,
            legal_identifier,
            client.client_address,
            client.client_city,
            client.client_postal_code,
            client.client_country_code,
            client.client_email || null,
            client.client_phone || null
          ]
        );
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
        const { id: attId, invoice_id, stored_name, ...attDataClean } = att; // on enlève stored_name

        const tempStoredName = `${Date.now()}-${Math.floor(Math.random()*1e9)}-${att.file_name}`;
        const cols = Object.keys(attDataClean).join(', ') + ', stored_name';
        const vals = [...Object.values(attDataClean), tempStoredName];
        const placeholdersAtt = vals.map((_, i) => `$${i + 1}`).join(', ');

        const result = await conn.query(
          `INSERT INTO invoicing.invoice_attachments (${cols}, invoice_id) VALUES (${placeholdersAtt}, $${vals.length + 1}) RETURNING id`,
          [...vals, id]
        );

        const attachmentId = result.rows[0].id;

        const finalName = `${id}_${attachmentId}_${att.file_name.replace(/\s+/g, '_')}`;
        const uploadDir = path.join(__dirname, '../../uploads/invoices');
        const finalPath = path.join(uploadDir, finalName);

        try {
          await fs.promises.rename(att.file_path, finalPath);

          if (fs.existsSync(att.file_path)) {
            await fs.promises.unlink(att.file_path);
          }
        } catch (err) {
          if (err.code !== 'ENOENT') throw err; // relance si ce n’est pas “fichier non trouvé”
        }

        await conn.query(
          `UPDATE invoicing.invoice_attachments SET stored_name = $1, file_path = $2 WHERE id = $3`,
          [finalName, finalPath, attachmentId]
        );  
      }
    }

    await conn.query('COMMIT');
    return await getInvoiceById(id);
    }
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
