const pool = require('../../config/db');
const path = require('path');
const fs = require('fs');
const { getSellerById } = require('../sellers/sellers.model'); 
const { saveAttachment, cleanupAttachments } = require("./invoiceAttachments.model");

/**
 * Récupère toutes les factures avec leurs lignes, taxes et justificatifs
 */
async function getAllInvoices() {
  // 1. Récupérer toutes les factures de base avec le nom du client joint
  const invoicesResult = await pool.query(
    `SELECT i.*, ic.legal_name as client_legal_name
     FROM invoicing.invoices i
     LEFT JOIN invoicing.invoice_client ic ON i.id = ic.invoice_id
     ORDER BY i.created_at DESC`
  );
  if (invoicesResult.rows.length === 0) {
    return [];
  }

  const invoices = invoicesResult.rows;
  const invoiceIds = invoices.map(inv => inv.id);

  // 2. Récupérer toutes les données liées en 3 requêtes au lieu de N*3
  const [linesResult, taxesResult, attachmentsResult] = await Promise.all([
    pool.query('SELECT * FROM invoicing.invoice_lines WHERE invoice_id = ANY($1::int[])', [invoiceIds]),
    pool.query('SELECT * FROM invoicing.invoice_taxes WHERE invoice_id = ANY($1::int[])', [invoiceIds]),
    pool.query('SELECT * FROM invoicing.invoice_attachments WHERE invoice_id = ANY($1::int[])', [invoiceIds])
  ]);

  // 3. Mapper les données pour un accès rapide
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

  // 4. Assembler le résultat final
  return invoices.map(invoice => ({
    ...invoice,
    lines: linesByInvoiceId[invoice.id] || [],
    taxes: taxesByInvoiceId[invoice.id] || [],
    attachments: attachmentsByInvoiceId[invoice.id] || [],
  }));
}

/**
 * Récupère une facture par son ID
 */
async function getInvoiceById(id) {
  const invoiceResult = await pool.query('SELECT * FROM invoicing.invoices WHERE id = $1', [id]);
  if (invoiceResult.rows.length === 0) return null;
  const invoice = invoiceResult.rows[0];  

  const [linesResult, taxesResult, attachmentsResult, clientResult, seller] = await Promise.all([
    pool.query('SELECT * FROM invoicing.invoice_lines WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_taxes WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_attachments WHERE invoice_id = $1', [id]),
    pool.query('SELECT * FROM invoicing.invoice_client WHERE invoice_id = $1', [id]),
    invoice.seller_id ? getSellerById(invoice.seller_id) : Promise.resolve(null)
  ]);

  return {
    ...invoice,
    lines: linesResult.rows,
    taxes: taxesResult.rows,
    attachments: attachmentsResult.rows,
    client: clientResult.rows[0] || null,
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
    await conn.query("BEGIN");
    // --- 1. Update invoice main data ---
    if (invoice) {
      // Trim invoice_number if present to ensure data quality
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
        const { id: lineId, invoice_id, ...lineData } = line; // eslint-disable-line no-unused-vars
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
        const { id: taxId, invoice_id, ...taxData } = tax; // eslint-disable-line no-unused-vars
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
     FROM invoicing.invoices i
     JOIN invoicing.sellers s ON i.seller_id = s.id
     LEFT JOIN invoicing.clients c ON i.client_id = c.id
     WHERE i.seller_id = $1
     ORDER BY i.created_at DESC`,
    [sellerId]
  );

  // On transforme chaque row pour imbriquer les infos client dans un objet `client`
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
    }
  }));
}

// Export de toutes les fonctions du modèle
module.exports = {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  deleteInvoice,
  updateInvoice,
  getInvoicesBySeller,
};