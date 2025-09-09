const pool = require('../../config/db');
const path = require('path');
const fs = require('fs');
const { getSellerById } = require('../sellers/sellers.model'); 
const { saveAttachment, cleanupAttachments } = require("./invoiceAttachments.model");

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
  const invoiceResult = await pool.query('SELECT * FROM invoicing.invoices WHERE id = $1', [id]);
  if (invoiceResult.rows.length === 0) return null;
  const invoice = invoiceResult.rows[0];  

  const [linesResult, taxesResult, attachmentsResult, clientResult] = await Promise.all([
    pool.query('SELECT * FROM invoicing.invoice_lines WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_taxes WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_attachments WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_client WHERE invoice_id = $1', [id]),
    invoice.seller_id ? getSellerById(invoice.seller_id) : Promise.resolve(null)
  ]);

  const client = clientResult.rows[0] || null;

  let seller = null;
  if (invoice.seller_id) {
    seller = await getSellerById(invoice.seller_id);
  }
  
  return {
    ...invoice,
    lines: linesResult.rows,
    taxes: taxesResult.rows,
    attachments: attachmentsResult.rows,
    client,
    seller
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
        "SELECT legal_name FROM invoicing.sellers WHERE id = $1",
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

    // --- Vérification unicité ---
    const existing = await conn.query(
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
      "client_id",
    ];
    const invoiceValues = invoiceColumns.map((col) => invoice[col] || null);
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
          (invoice_id, legal_name, legal_identifier_type, legal_identifier, address, city, postal_code, country_code, email, phone)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          invoiceId,
          client.client_legal_name ||
            `${client.client_first_name || ""} ${client.client_last_name || ""}`.trim(),
          client.client_siret ? "SIRET" : client.client_vat_number ? "VAT" : "NAME",
          client.client_siret ||
            client.client_vat_number ||
            `${client.client_first_name || ""} ${client.client_last_name || ""}`.trim(),
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
          `INSERT INTO invoicing.invoice_lines (${cols}, invoice_id) VALUES (${placeholdersLine}, $${
            vals.length + 1
          })`,
          [...vals, invoiceId]
        );
      }),
      ...taxes.map((tax) => {
        const cols = Object.keys(tax).join(", ");
        const vals = Object.values(tax);
        const placeholdersTax = vals.map((_, i) => `$${i + 1}`).join(", ");
        return conn.query(
          `INSERT INTO invoicing.invoice_taxes (${cols}, invoice_id) VALUES (${placeholdersTax}, $${
            vals.length + 1
          })`,
          [...vals, invoiceId]
        );
      }),
    ]);

    // --- Gestion des attachments via le service ---
    for (const att of attachments) {
      await saveAttachment(conn, invoiceId, att);
    }

    // Nettoyage sécurité (supprimer fichiers orphelins si besoin)
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
 * Supprime une facture uniquement si elle est en draft
 */
async function deleteInvoice(id) {
  const result = await pool.query(
    `DELETE FROM invoicing.invoices
     WHERE id = $1 AND status = 'draft'
     RETURNING *`,
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { createInvoice, deleteInvoice };

/**
 * Met à jour une facture complète (facture, client, lignes, taxes, attachments)
 * dans une seule transaction.
 */
async function updateInvoice(
  id,
  { invoice, client, lines, taxes, newAttachments, existingAttachments }
) {
  const conn = await pool.connect();
  try {
    console.log("=== updateInvoice called for id:", id, "===");

    await conn.query("BEGIN");
    console.log("Transaction started");

    // --- 1. Update invoice main data ---
    if (invoice) {
      // Trim invoice_number if present to ensure data quality
      if (invoice.invoice_number) {
        invoice.invoice_number = invoice.invoice_number.trim().slice(0, 20);
      }

      console.log("Updating invoice main data:", invoice);
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
      ];
      const filteredColumns = invoiceColumns.filter(col => invoice[col] !== undefined);
      const updates = filteredColumns.map((col, i) => `${col} = $${i + 2}`);
      const values = filteredColumns.map(col => invoice[col]);

      if (updates.length > 0) {
        await conn.query(
          `UPDATE invoicing.invoices SET ${updates.join(", ")} WHERE id = $1`,
          [id, ...values]
        );
      }
    }

    // --- 2. Update invoice client ---
    if (client) {
      if (client.client_id) {
        await conn.query(
          "UPDATE invoicing.invoices SET client_id = $1 WHERE id = $2",
          [client.client_id, id]
        );
      }

      const clientExistsResult = await conn.query(
        "SELECT id FROM invoicing.invoice_client WHERE invoice_id = $1",
        [id]
      );

      const legal_name =
        client.client_legal_name ||
        `${client.client_first_name || ""} ${client.client_last_name || ""}`.trim();
      const legal_identifier_type = client.client_siret
        ? "SIRET"
        : client.client_vat_number
        ? "VAT"
        : "NAME";
      const legal_identifier =
        client.client_siret || client.client_vat_number || legal_name;

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
            client.client_phone || null,
          ]
        );
      } else if (legal_name) {
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
            client.client_phone || null,
          ]
        );
      }
    }

    // --- 3. Update invoice lines ---
    await conn.query("DELETE FROM invoicing.invoice_lines WHERE invoice_id = $1", [id]);
    if (lines?.length) {
      for (const line of lines) {
        const { id: lineId, invoice_id, ...lineData } = line;
        const cols = Object.keys(lineData).join(", ");
        const vals = Object.values(lineData);
        const placeholdersLine = vals.map((_, i) => `$${i + 1}`).join(", ");
        await conn.query(
          `INSERT INTO invoicing.invoice_lines (${cols}, invoice_id) VALUES (${placeholdersLine}, $${
            vals.length + 1
          })`,
          [...vals, id]
        );
      }
    }

    await conn.query("DELETE FROM invoicing.invoice_taxes WHERE invoice_id = $1", [id]);
    if (taxes?.length) {
      for (const tax of taxes) {
        const { id: taxId, invoice_id, ...taxData } = tax;
        const cols = Object.keys(taxData).join(", ");
        const vals = Object.values(taxData);
        const placeholdersTax = vals.map((_, i) => `$${i + 1}`).join(", ");
        await conn.query(
          `INSERT INTO invoicing.invoice_taxes (${cols}, invoice_id) VALUES (${placeholdersTax}, $${
            vals.length + 1
          })`,
          [...vals, id]
        );
      }
    }

    // --- 4. Attachments ---
    console.log("📂 Processing attachments...");

    // Récupérer ceux existants en DB
    const { rows: dbAttachments } = await conn.query(
      `SELECT id, stored_name FROM invoicing.invoice_attachments WHERE invoice_id = $1`,
      [id]
    );

    // Parser ceux envoyés par le front
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

    // Supprimer ceux que le front ne veut pas garder
    for (const dbAtt of dbAttachments) {
      if (!keepIds.has(dbAtt.id)) {
        await conn.query(`DELETE FROM invoicing.invoice_attachments WHERE id = $1`, [dbAtt.id]);
      }
    }

    // Ajouter les nouveaux fichiers via saveAttachment
    if (newAttachments?.length) {
      for (const att of newAttachments) {
        await saveAttachment(conn, id, att); // ⬅️ refacto appliqué
      }
    }

    // Nettoyer les fichiers orphelins côté serveur
    const uploadDir = path.join(__dirname, "../../uploads/invoices");
    const { rows: dbFiles } = await conn.query(
      `SELECT stored_name FROM invoicing.invoice_attachments WHERE invoice_id = $1`,
      [id]
    );
    const dbFileSet = new Set(dbFiles.map((f) => f.stored_name));
    const allFiles = await fs.promises.readdir(uploadDir);

    for (const file of allFiles) {
      if (file.startsWith(`${id}_`) && !dbFileSet.has(file)) {
        try {
          await fs.promises.unlink(path.join(uploadDir, file));
        } catch (err) {
          console.error("❌ Failed to remove file:", file, err);
        }
      }
    }

    await conn.query("COMMIT");
    console.log("Transaction committed successfully for invoice", id);

    return await getInvoiceById(id);
  } catch (err) {
    await conn.query("ROLLBACK");
    console.error("Transaction rolled back due to error:", err);
    throw err;
  } finally {
    conn.release();
  }
}

// ----------------- Get invoices by seller -----------------
async function getInvoicesBySeller(sellerId) {
  const result = await pool.query(
    `SELECT *
     FROM invoicing.invoices
     WHERE seller_id = $1
     ORDER BY created_at DESC`,
    [sellerId]
  );
  return result.rows;
}

module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice,
  getInvoicesBySeller
};
