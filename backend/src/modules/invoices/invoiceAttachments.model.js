const fs = require("fs");
const path = require("path");
const db = require("../../config/db");
const { generateStoredName, getFinalPath } = require("../../utils/fileNaming");
const storageService = require("../../services");
const SCHEMA = process.env.DB_SCHEMA || 'public';

/**
 * Sauvegarde une pièce jointe d'une facture
 * @param {object} conn - connexion DB
 * @param {number} invoiceId
 * @param {object} att - { file_path, file_name, attachment_type?, isMain? }
 */
async function saveAttachment(conn, invoiceId, att) {
  // Déterminer le type réel pour le stockage
  let attachmentType = att.attachment_type;
  if (!attachmentType) {
    attachmentType = att.isMain ? 'main' : 'additional';
  }

  // Générer le nom de fichier
  const storedName = generateStoredName(invoiceId, attachmentType, att.file_name);

  // Chemin final local
  const finalPath = getFinalPath(storedName, attachmentType); // getFinalPath peut recevoir attachmentType pour dossiers séparés

  // Déplacer le fichier temporaire
  await fs.promises.rename(att.file_path, finalPath);

  // Sauvegarde via storageService (B2 ou local)
  const relativePath = path.relative(path.resolve(__dirname, '../../uploads'), finalPath);
  await storageService.save(await fs.promises.readFile(finalPath), relativePath);

  // Insérer en DB
  const result = await conn.query(
    `INSERT INTO ${SCHEMA}.invoice_attachments
      (invoice_id, file_name, file_path, stored_name, attachment_type)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [invoiceId, att.file_name, relativePath, storedName, attachmentType]
  );

  return result.rows[0];
}

/**
 * Supprime les fichiers orphelins d'une facture
 */
async function cleanupAttachments(conn, invoiceId) {
  const uploadDir = getFinalPath(""); 
  const relativeDir = uploadDir.split('uploads/')[1]; // ex: 'invoices' ou 'additional'

  const { rows: dbFiles } = await conn.query(
    `SELECT stored_name FROM ${SCHEMA}.invoice_attachments WHERE invoice_id = $1`,
    [invoiceId]
  );
  const dbFileSet = new Set(dbFiles.map(f => f.stored_name));

  const allFiles = await storageService.list(relativeDir);
  
  for (const file of allFiles) {
    if (file.startsWith(`${invoiceId}_`) && !dbFileSet.has(file)) {
      await storageService.delete(`${relativeDir}/${file}`);
    }
  }
}

/**
 * Récupère une pièce jointe principale ou supplémentaire
 */
async function getAttachment(invoiceId, type) {
  const res = await db.query(
    `SELECT file_name, file_path 
     FROM ${SCHEMA}.invoice_attachments 
     WHERE invoice_id = $1 AND attachment_type = $2`,
    [invoiceId, type]
  );
  return res.rows[0] || null;
}

/**
 * Récupère toutes les pièces jointes d'un type
 */
async function getAttachmentsByType(invoiceId, type) {
  const res = await db.query(
    `SELECT file_name, file_path
     FROM ${SCHEMA}.invoice_attachments
     WHERE invoice_id = $1 AND attachment_type = $2`,
    [invoiceId, type]
  );
  return res.rows.map(att => ({
    file_path: path.resolve(att.file_path),
    file_name: att.file_name
  }));
}

/**
 * Récupère les attachments additionnels
 */
async function getAdditionalAttachments(invoiceId) {
  return getAttachmentsByType(invoiceId, 'additional');
}

module.exports = { 
  saveAttachment, 
  cleanupAttachments,
  getAttachment,
  getAttachmentsByType,
  getAdditionalAttachments
};
