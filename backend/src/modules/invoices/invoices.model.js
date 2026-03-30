const pool = require('../../config/db');
const path = require('path');
const { getSellerById } = require('../sellers/sellers.model');
const { saveAttachment, cleanupAttachments } = require("./invoiceAttachments.model");
const storageService = require('../../services');
const SCHEMA = process.env.DB_SCHEMA || 'public';
const logger = require('../../utils/logger');

/**
 * Récupère toutes les factures avec leurs lignes, taxes et justificatifs
 */
async function getAllInvoices() {
  const invoicesResult = await pool.query(
    `SELECT i.*, ic.legal_name as client_legal_name
     FROM ${SCHEMA}.invoices i
     LEFT JOIN ${SCHEMA}.invoice_client ic ON i.id = ic.invoice_id
     ORDER BY i.created_at DESC`
  );
  if (invoicesResult.rows.length === 0) return [];

  const invoices = invoicesResult.rows;
  const invoiceIds = invoices.map(inv => inv.id);

  const [linesResult, taxesResult, attachmentsResult] = await Promise.all([
    pool.query(`SELECT * FROM ${SCHEMA}.invoice_lines WHERE invoice_id = ANY($1::int[])`, [invoiceIds]),
    pool.query(`SELECT * FROM ${SCHEMA}.invoice_taxes WHERE invoice_id = ANY($1::int[])`, [invoiceIds]),
    pool.query(`SELECT * FROM ${SCHEMA}.invoice_attachments WHERE invoice_id = ANY($1::int[])`, [invoiceIds]),
  ]);

  const linesByInvoiceId = linesResult.rows.reduce((acc, line) => {
    (acc[line.invoice_id] = acc[line.invoice_id] || []).push(line);
    return acc;
  }, {});
  const taxesByInvoiceId = taxesResult.rows.reduce((acc, tax) => {
    (acc[tax.invoice_id] = acc[tax.invoice_id] || []).push(tax);
    return acc;
  }, {});
  const attachmentsByInvoiceId = attachmentsResult.rows.reduce((acc, attachment) => {
    (acc[attachment.invoice_id] = acc[attachment.invoice_id] || []).push(attachment);
    return acc;
  }, {});

  return invoices.map(invoice => ({
    ...invoice,
    lines: linesByInvoiceId[invoice.id] || [],
    taxes: taxesByInvoiceId[invoice.id] || [],
    attachments: attachmentsByInvoiceId[invoice.id] || [],
  }));
}

/**
 * Récupère les factures d'acompte pour un vendeur donné
 */
async function getDepositInvoices(seller, clientId = null) {
  if (!seller?.id) {
    logger.error('[Model] getDepositInvoices - Seller missing');
    throw new Error("Seller is required");
  }

  let query = `
    SELECT 
      i.id,
      i.invoice_number,
      i.fiscal_year,
      i.issue_date,
      i.total,
      c.legal_name AS client_name
    FROM ${SCHEMA}.invoices i
    LEFT JOIN ${SCHEMA}.clients c ON i.client_id = c.id
    WHERE i.invoice_type = 'deposit'
      AND i.seller_id = $1
      AND NOT EXISTS (
        SELECT 1
        FROM ${SCHEMA}.invoices i2
        WHERE i2.original_invoice_number = i.invoice_number
      )
  `;

  const params = [seller.id];

  if (clientId) {
    query += ` AND i.client_id = $2`;
    params.push(clientId);
  }

  logger.info({ query, params }, '[Model] getDepositInvoices - executing query');

  try {
    const { rows } = await pool.query(query, params);
    logger.info({ rowCount: rows.length }, '[Model] getDepositInvoices - rows fetched');
    return rows;
  } catch (err) {
    logger.error({ err }, '[Model] getDepositInvoices - query failed');
    throw err;
  }
}

/**
 * Récupère une facture par son ID
 */
async function getInvoiceById(id) {
  const invoiceResult = await pool.query(`SELECT * FROM ${SCHEMA}.invoices WHERE id = $1`, [id]);
  if (invoiceResult.rows.length === 0) return null;
  const invoice = invoiceResult.rows[0];

  const [linesResult, taxesResult, attachmentsResult, clientResult, seller] = await Promise.all([
    pool.query(`SELECT * FROM ${SCHEMA}.invoice_lines WHERE invoice_id = $1`, [id]),
    pool.query(`SELECT * FROM ${SCHEMA}.invoice_taxes WHERE invoice_id = $1`, [id]),
    pool.query(`SELECT * FROM ${SCHEMA}.invoice_attachments WHERE invoice_id = $1`, [id]),
    pool.query(`SELECT * FROM ${SCHEMA}.invoice_client WHERE invoice_id = $1`, [id]),
    invoice.seller_id ? getSellerById(invoice.seller_id) : Promise.resolve(null),
  ]);

  return {
    ...invoice,
    lines: linesResult.rows,
    taxes: taxesResult.rows,
    attachments: attachmentsResult.rows,
    client: clientResult.rows[0] || null,
    seller,
  };
}

/**
 * Crée une facture avec lignes, taxes et justificatifs
 */
async function createInvoice({ invoice, client, lines = [], taxes = [], attachments = [] }) {
  const conn = await pool.connect();

  try {
    await conn.query("BEGIN");

    // --- Remplir seller_legal_name ---
    if (invoice.seller_id && !invoice.seller_legal_name) {
      const sellerRes = await conn.query(
        `SELECT legal_name FROM ${SCHEMA}.sellers WHERE id = $1`,
        [invoice.seller_id]
      );
      invoice.seller_legal_name = sellerRes.rows[0]?.legal_name || null;
    }

    // --- Validation invoice_number ---
    if (!invoice.invoice_number) throw new Error("invoice_number obligatoire");
    invoice.invoice_number = invoice.invoice_number.trim().slice(0, 20);

    // --- Validation fiscal_year ---
    if (!invoice.fiscal_year) invoice.fiscal_year = new Date(invoice.issue_date).getFullYear();
    const issueYear = new Date(invoice.issue_date).getFullYear();
    const fy = invoice.fiscal_year;
    if (fy < issueYear - 1 || fy > issueYear + 1) {
      throw new Error(
        `Exercice fiscal invalide : ${fy} pour une date d'émission ${invoice.issue_date}`
      );
    }

    // --- Vérification unicité invoice_number ---
    const existing = await conn.query(
      `SELECT id 
       FROM ${SCHEMA}.invoices 
       WHERE seller_id = $1 AND fiscal_year = $2 AND invoice_number = $3`,
      [invoice.seller_id, invoice.fiscal_year, invoice.invoice_number]
    );
    if (existing.rows.length > 0) {
      throw new Error(
        `Une facture avec le même numéro ${invoice.invoice_number} pour ce vendeur et cet exercice existe déjà`
      );
    }

    // --- Vérification attachments ---
    const mainAttachments = attachments.filter((a) => a.attachment_type === "main");
    if (mainAttachments.length !== 1) {
      throw new Error("Une facture doit avoir un justificatif principal.");
    }

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
      "payment_method",
      "invoice_type",
      "client_id",
      "original_invoice_number",
      "original_invoice_id",
      "original_quote_number"
    ];
    const invoiceValues = invoiceColumns.map((col) => invoice[col] || null);
    const placeholders = invoiceColumns.map((_, i) => `$${i + 1}`).join(", ");

    const invoiceRes = await conn.query(
      `INSERT INTO ${SCHEMA}.invoices (${invoiceColumns.join(", ")}) VALUES (${placeholders}) RETURNING *`,
      invoiceValues
    );
    const invoiceId = invoiceRes.rows[0].id;

    // --- Attribution de invoice_sequence_number (hors devis) ---
    if (invoice.invoice_type !== "quote") {
      // Upsert atomique : évite les race conditions
      const seqRes = await conn.query(
        `INSERT INTO ${SCHEMA}.invoice_sequence (seller_id, last_sequence)
         VALUES ($1, 1)
         ON CONFLICT (seller_id) DO UPDATE
           SET last_sequence = invoice_sequence.last_sequence + 1
         RETURNING last_sequence`,
        [invoice.seller_id]
      );
      const nextSeq = seqRes.rows[0].last_sequence;

      await conn.query(
        `UPDATE ${SCHEMA}.invoices
         SET invoice_sequence_number = $1
         WHERE id = $2`,
        [nextSeq, invoiceId]
      );
    }

    // --- Insertion client ---
    if (client) {
      await conn.query(
        `INSERT INTO ${SCHEMA}.invoice_client 
          (invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code, email, phone)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          invoiceId,
          client.client_legal_name ||
            `${client.client_first_name || ""} ${client.client_last_name || ""}`.trim(),
          client.client_siret ? "SIRET" : client.client_vat_number ? "VAT" : "NAME",
          client.client_siret || client.client_vat_number || client.client_legal_name,
          client.client_address || null,
          client.client_city || null,
          client.client_postal_code || null,
          client.client_country_code || null,
          client.client_email || null,
          client.client_phone || null,
        ]
      );
    }

    // --- Insertion lignes & taxes ---
    await Promise.all([
      ...lines.map((line) => {
        const cols = Object.keys(line).join(", ");
        const vals = Object.values(line);
        const placeholdersLine = vals.map((_, i) => `$${i + 1}`).join(", ");
        return conn.query(
          `INSERT INTO ${SCHEMA}.invoice_lines (${cols}, invoice_id) VALUES (${placeholdersLine}, $${vals.length + 1})`,
          [...vals, invoiceId]
        );
      }),
      ...taxes.map((tax) => {
        const cols = Object.keys(tax).join(", ");
        const vals = Object.values(tax);
        const placeholdersTax = vals.map((_, i) => `$${i + 1}`).join(", ");
        return conn.query(
          `INSERT INTO ${SCHEMA}.invoice_taxes (${cols}, invoice_id) VALUES (${placeholdersTax}, $${vals.length + 1})`,
          [...vals, invoiceId]
        );
      }),
    ]);

    // --- Gestion des attachments ---
    for (const att of attachments) {
      await saveAttachment(conn, invoiceId, att);
    }
    await cleanupAttachments(conn, invoiceId);

    await conn.query("COMMIT");
    return await getInvoiceById(invoiceId);

  } catch (err) {
    await conn.query("ROLLBACK");
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * "Supprime" une facture uniquement si elle est en draft
 * => passe en cancelled au lieu de DELETE
 */
async function deleteInvoice(id, cancelReason = null) {
  try {
    const result = await pool.query(
      `UPDATE invoices
       SET status = 'cancelled',
           cancelled_at = NOW(),
           cancel_reason = $2
       WHERE id = $1 AND status = 'draft'
       RETURNING *`,
      [id, cancelReason]
    );

    logger.info(
      { event: "invoice_update", id, cancelReason, rows: result.rows },
      "InvoicesModel.deleteInvoice updated rows"
    );

    return result.rows[0] || null;
  } catch (err) {
    logger.error({ event: "invoice_update_error", id, cancelReason, err }, "Erreur lors de la mise à jour de la facture");
    throw err;
  }
}

/**
 * Met à jour une facture complète (facture, client, lignes, taxes, attachments)
 */
async function updateInvoice(id, { invoice, client, lines, taxes, newAttachments, existingAttachments }) {
  const conn = await pool.connect();
  try {
    await conn.query("BEGIN");

    // --- 1. Update invoice main data ---
    if (invoice) {
      if (invoice.invoice_number) {
        invoice.invoice_number = invoice.invoice_number.trim().slice(0, 20);
      }

      const invoiceColumns = [
        "invoice_number",
        "issue_date",
        "fiscal_year",
        "seller_id",
        "contract_number",
        "purchase_order_number",
        "payment_terms",
        "payment_method",
        "supply_date",
        "invoice_type",
        "original_invoice_number",
        "original_invoice_id",
        "original_quote_number"
      ];
      const filteredColumns = invoiceColumns.filter(col => invoice[col] !== undefined);
      const updates = filteredColumns.map((col, i) => `${col} = $${i + 2}`);
      const values = filteredColumns.map(col => invoice[col]);

      if (updates.length > 0) {
        await conn.query(
          `UPDATE ${SCHEMA}.invoices SET ${updates.join(", ")} WHERE id = $1`,
          [id, ...values]
        );
      }
    }

    // --- 2. Update invoice client ---
    if (client) {
      if (client.client_id) {
        await conn.query(
          `UPDATE ${SCHEMA}.invoices SET client_id = $1 WHERE id = $2`,
          [client.client_id, id]
        );
      }

      const clientExistsResult = await conn.query(
        `SELECT id FROM ${SCHEMA}.invoice_client WHERE invoice_id = $1`,
        [id]
      );

      const legal_name =
        client.client_legal_name ||
        `${client.client_first_name || ""} ${client.client_last_name || ""}`.trim();
      const legal_identifier_type = client.client_siret ? "SIRET" : client.client_vat_number ? "VAT" : "NAME";
      const legal_identifier = client.client_siret || client.client_vat_number || legal_name;

      if (clientExistsResult.rows.length > 0) {
        await conn.query(
          `UPDATE ${SCHEMA}.invoice_client 
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
            client.client_phone || null,
          ]
        );
      } else if (legal_name) {
        await conn.query(
          `INSERT INTO ${SCHEMA}.invoice_client 
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
            client.client_phone || null,
          ]
        );
      }
    }

    // --- 3. Update lines & taxes ---
    await conn.query(`DELETE FROM ${SCHEMA}.invoice_lines WHERE invoice_id = $1`, [id]);
    if (lines?.length) {
      for (const line of lines) {
        const { id: lineId, invoice_id, ...lineData } = line; // eslint-disable-line no-unused-vars
        const cols = Object.keys(lineData).join(", ");
        const vals = Object.values(lineData);
        const placeholdersLine = vals.map((_, i) => `$${i + 1}`).join(", ");
        await conn.query(
          `INSERT INTO ${SCHEMA}.invoice_lines (${cols}, invoice_id) VALUES (${placeholdersLine}, $${vals.length + 1})`,
          [...vals, id]
        );
      }
    }

    await conn.query(`DELETE FROM ${SCHEMA}.invoice_taxes WHERE invoice_id = $1`, [id]);
    if (taxes?.length) {
      for (const tax of taxes) {
        const { id: taxId, invoice_id, ...taxData } = tax; // eslint-disable-line no-unused-vars
        const cols = Object.keys(taxData).join(", ");
        const vals = Object.values(taxData);
        const placeholdersTax = vals.map((_, i) => `$${i + 1}`).join(", ");
        await conn.query(
          `INSERT INTO ${SCHEMA}.invoice_taxes (${cols}, invoice_id) VALUES (${placeholdersTax}, $${vals.length + 1})`,
          [...vals, id]
        );
      }
    }

    // --- 4. Attachments ---
    const { rows: dbAttachments } = await conn.query(
      `SELECT id, stored_name FROM ${SCHEMA}.invoice_attachments WHERE invoice_id = $1`,
      [id]
    );

    let existingFromFront = [];
    if (typeof existingAttachments === "string" && existingAttachments.trim() !== "") {
      try {
        existingFromFront = JSON.parse(existingAttachments);
      } catch {
        existingFromFront = [];
      }
    } else if (Array.isArray(existingAttachments)) {
      existingFromFront = existingAttachments;
    }

    const keepIds = new Set(existingFromFront.map((a) => a.id).filter(Boolean));

    for (const dbAtt of dbAttachments) {
      if (!keepIds.has(dbAtt.id)) {
        await conn.query(`DELETE FROM ${SCHEMA}.invoice_attachments WHERE id = $1`, [dbAtt.id]);
      }
    }

    if (newAttachments?.length) {
      for (const att of newAttachments) {
        await saveAttachment(conn, id, att);
      }
    }

    // Nettoyer les fichiers orphelins côté serveur
    const uploadDir = path.join(__dirname, "../../uploads/invoices");
    const relativeDir = uploadDir.split('uploads/')[1];

    const { rows: dbFiles } = await conn.query(
      `SELECT stored_name FROM ${SCHEMA}.invoice_attachments WHERE invoice_id = $1`,
      [id]
    );
    const dbFileSet = new Set(dbFiles.map((f) => f.stored_name));

    const allFiles = await storageService.list(relativeDir);
    for (const file of allFiles) {
      if (file.startsWith(`${id}_`) && !dbFileSet.has(file)) {
        try {
          await storageService.delete(`${relativeDir}/${file}`);
        } catch (err) {
          logger.error("❌ Failed to remove file:", file, err);
        }
      }
    }

    await conn.query("COMMIT");
    return await getInvoiceById(id);

  } catch (err) {
    await conn.query("ROLLBACK");
    logger.error("Transaction rolled back due to error:", err);
    throw err;
  } finally {
    conn.release();
  }
}

/**
 * Récupère les factures d'un vendeur avec le client imbriqué
 */
async function getInvoicesBySeller(sellerId) {
  const result = await pool.query(
    `SELECT 
        i.*,
        s.plan AS seller_plan,
        c.id AS client_id,
        c.is_company AS client_is_company,
        c.firstname AS client_firstname,
        c.lastname AS client_lastname,
        c.legal_name AS client_legal_name,
        c.siret AS client_siret,
        c.vat_number AS client_vat_number,
        c.address AS client_address,
        c.city AS client_city,
        c.postal_code AS client_postal_code,
        c.country_code AS client_country_code,
        c.email AS client_email,
        c.phone AS client_phone
     FROM ${SCHEMA}.invoices i
     JOIN ${SCHEMA}.sellers s ON i.seller_id = s.id
     LEFT JOIN ${SCHEMA}.clients c ON i.client_id = c.id
     WHERE i.seller_id = $1
     ORDER BY i.created_at DESC`,
    [sellerId]
  );

  return result.rows.map(row => ({
    ...row,
    plan: row.seller_plan,
    client: {
      id: row.client_id,
      is_company: row.client_is_company,
      firstname: row.client_firstname,
      lastname: row.client_lastname,
      legal_name: row.client_legal_name,
      siret: row.client_siret,
      vat_number: row.client_vat_number,
      address: row.client_address,
      city: row.client_city,
      postal_code: row.client_postal_code,
      country_code: row.client_country_code,
      email: row.client_email,
      phone: row.client_phone,
    },
  }));
}

module.exports = {
  getAllInvoices,
  getDepositInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice,
  getInvoicesBySeller,
};