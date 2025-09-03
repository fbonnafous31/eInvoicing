const fs = require("fs");
const db = require("../../config/db");
const path = require("path");
const { generateStoredName, getFinalPath } = require("../../utils/fileNaming");

async function saveAttachment(conn, invoiceId, att) {
  const attachmentType = att.attachment_type || "additional";
  const storedName = generateStoredName(invoiceId, attachmentType, att.file_name);
  const finalPath = getFinalPath(storedName);

  // Déplacer le fichier
  await fs.promises.rename(att.file_path, finalPath);

  // Insérer en DB
  const result = await conn.query(
    `INSERT INTO invoicing.invoice_attachments
      (invoice_id, file_name, file_path, stored_name, attachment_type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [invoiceId, att.file_name, finalPath, storedName, attachmentType]
  );

  return result.rows[0];
}

async function cleanupAttachments(conn, invoiceId) {
  const uploadDir = getFinalPath(""); // juste le dossier
  const { rows: dbFiles } = await conn.query(
    `SELECT stored_name FROM invoicing.invoice_attachments WHERE invoice_id = $1`,
    [invoiceId]
  );
  const dbFileSet = new Set(dbFiles.map(f => f.stored_name));

  const allFiles = await fs.promises.readdir(uploadDir);
  for (const file of allFiles) {
    if (file.startsWith(`${invoiceId}_`) && !dbFileSet.has(file)) {
      await fs.promises.unlink(path.join(uploadDir, file));
    }
  }
}

async function getAttachment(invoiceId, type) {
  const res = await db.query(
    `SELECT file_name, file_path 
     FROM invoicing.invoice_attachments 
     WHERE invoice_id = $1 AND attachment_type = $2`,
    [invoiceId, type]
  );
  return res.rows[0] || null;
}

async function getAttachmentsByType(invoiceId, type) {
  const res = await db.query(
    `SELECT file_name, file_path
     FROM invoicing.invoice_attachments
     WHERE invoice_id = $1 AND attachment_type = $2`,
    [invoiceId, type]
  );
  return res.rows; 
}

async function getAdditionalAttachments(invoiceId) {
  const attachments = await getAttachmentsByType(invoiceId, 'additional');
  return attachments.map(att => ({
    file_path: path.resolve(att.file_path),
    file_name: att.file_name
  }));
}

module.exports = { 
  getAttachment, 
  saveAttachment, 
  cleanupAttachments,
  getAdditionalAttachments
};
