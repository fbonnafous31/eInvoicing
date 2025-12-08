const fs = require('fs');
const tmp = require('tmp');
const path = require('path');
const InvoicesService = require('./invoices.service');
const InvoicePdpService = require('./invoicePdp.service');
const PDPService = require('../pdp/PDPService');
const { getInvoiceById } = require('./invoices.model');
const { generateQuotePdf, generateInvoicePdfBuffer: generatePdfUtil } = require('../../utils/invoice-pdf/generateInvoicePdf');
const InvoiceStatusModel = require('../invoices/invoiceStatus.model');
const logger = require('../../utils/logger');

/**
 * Helper pour envelopper les gestionnaires de routes asynchrones et attraper les erreurs.
 * Cela évite de répéter les blocs try...catch partout.
 */
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Helper pour parser les champs JSON d'une requête multipart.
 */
function _parseMultipartBody(body) {
  const parsed = {};
  const fieldsToParse = ['invoice', 'lines', 'taxes', 'attachments_meta', 'client', 'existing_attachments'];

  for (const key of fieldsToParse) {
    if (body[key]) {
      try {
        parsed[key] = JSON.parse(body[key]);
      } catch (e) {       
        logger.error(`Erreur parsing ${key}:`, e.message); 
        const err = new Error(`Le champ '${key}' contient du JSON invalide.`);
        err.statusCode = 400;
        throw err;
      }
    }
  }
  return parsed;
}

/**
 * Liste toutes les factures
 */
const listInvoices = asyncHandler(async (req, res) => {
  const invoices = await InvoicesService.listInvoices();
  res.json(invoices);
});

/**
 * Récupère une facture par ID
 */
const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await InvoicesService.getInvoice(req.params.id);
  if (!invoice) return res.status(404).json({ message: 'Facture non trouvée' });
  res.json(invoice);
});

/**
 * Crée une facture avec lignes, taxes et justificatifs
 */
const createInvoice = asyncHandler(async (req, res) => {
  const { invoice, client, lines, taxes, attachments_meta = [] } = _parseMultipartBody(req.body);

  const attachments = (req.files.attachments || []).map((file, i) => ({
    file_name: file.originalname,
    file_path: file.path,
    attachment_type: attachments_meta[i]?.attachment_type || 'additional'
  }));

  const mainCount = attachments.filter(f => f.attachment_type === 'main').length;
  if (mainCount !== 1) {
    return res.status(400).json({ message: "Une facture doit avoir exactement un justificatif principal." });
  }

  const newInvoice = await InvoicesService.createInvoice({ invoice, client, lines, taxes, attachments });
  res.status(201).json(newInvoice);
});

/**
 * Supprime une facture par ID
 */
const deleteInvoice = asyncHandler(async (req, res) => {
  const deleted = await InvoicesService.deleteInvoice(req.params.id);
  if (!deleted) {
    return res.status(400).json({ message: 'Facture non trouvée ou non en draft' });
  }
  res.status(204).send();
});

/**
 * Met à jour une facture avec lignes, taxes et justificatifs
 */
const updateInvoice = asyncHandler(async (req, res) => {
  const existingInvoice = await InvoicesService.getInvoiceById(req.params.id);
  if (!existingInvoice) {
    return res.status(404).json({ message: "Facture introuvable" });
  }

  // Logique de validation des statuts
    const ts = existingInvoice.technical_status?.toLowerCase();
    const bs = existingInvoice.business_status;
    if (ts && !["draft", "pending"].includes(ts)) {
      if (bs !== "208") {
        // Bloc classique : interdiction de modifier
        return res.status(403).json({ message: "Cette facture ne peut pas être modifiée." });
      }
    }

  const { invoice, client, lines, taxes, attachments_meta = [], existing_attachments = [] } = _parseMultipartBody(req.body);

  const newAttachments = (req.files?.attachments || []).map((file, i) => ({
    file_name: file.originalname,
    file_path: file.path,
    attachment_type: attachments_meta[i]?.attachment_type || "additional"
  }));

  const updatedInvoice = await InvoicesService.updateInvoice(req.params.id, {
    invoice,
    client,
    lines,
    taxes,
    newAttachments,
    existingAttachments: existing_attachments
  });

  res.status(200).json(updatedInvoice);
});

const createInvoicePdf = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) {
    return res.status(404).json({ error: "Facture introuvable" });
  }

  // Génération du PDF en mémoire
  const pdfBytes = await generateQuotePdf(invoice); 

  // Définir les headers pour téléchargement
  const fileName = `facture_${invoice.invoice_number?.trim().replace(/[\/\\?%*:|"<>#]/g, "_") || invoice.id}.pdf`;
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

  // Envoyer le PDF
  res.send(Buffer.from(pdfBytes));
});

const { getSellerById } = require('../sellers/sellers.service'); 

const generateInvoicePdfBuffer = asyncHandler(async (req, res) => {
  const invoiceBody = { ...req.body };

  // ---------------- Récupérer le seller complet ----------------
  let seller = {};
  if (invoice.seller_id !== req.seller.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  
  const sellerId = invoiceBody.header?.seller_id;
  if (sellerId) {
    seller = await getSellerById(sellerId); 
  }

  // ---------------- Composer l'objet invoice complet ----------------
  const invoice = {
    ...invoiceBody,
    seller
  };

  // ---------------- Générer le PDF en mémoire ----------------
  const pdfBytes = await generatePdfUtil(invoice); 

  // ---------------- Envoyer le PDF en mémoire ----------------
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="facture_${invoice.header?.invoice_number || 'preview'}.pdf"`
  );
  res.send(pdfBytes);
});

const getInvoices = asyncHandler(async (req, res) => {
    if (!req.seller) {
      return res.status(403).json({ message: 'Vendeur non trouvé' });
    }

    const invoices = await InvoicesService.getInvoicesBySeller(req.seller.id);
    res.json(invoices);
});

const sendInvoice = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const invoice = await InvoicesService.getInvoiceById(invoiceId);

  if (!invoice) {
    return res.status(404).json({ error: 'Facture introuvable' });
  }

  let xmlBuffer;

  // 🔹 Récupération du Factur-X selon le backend
  if (process.env.STORAGE_BACKEND === 'local') {
    const localPath = path.join(__dirname, `../../uploads/factur-x/${invoiceId}-factur-x.xml`);
    if (!fs.existsSync(localPath)) {
      return res.status(404).json({ error: `Le fichier XML final pour la facture ${invoiceId} est introuvable.` });
    }
    xmlBuffer = fs.readFileSync(localPath);
  } else if (process.env.STORAGE_BACKEND === 'b2') {
    const remotePath = `factur-x/${invoiceId}-factur-x.xml`;
    xmlBuffer = await storageService.get(remotePath); // retourne un Buffer
    if (!xmlBuffer || !xmlBuffer.length) {
      return res.status(404).json({ error: `Le fichier XML final pour la facture ${invoiceId} est introuvable sur B2.` });
    }
  } else {
    return res.status(500).json({ error: 'Storage backend non configuré' });
  }

  const provider = process.env.PDP_PROVIDER || 'mock';
  const pdp = new PDPService(provider);

  // 🔹 Création d'un fichier temporaire si besoin pour le PDP
  const tempFile = tmp.fileSync({ postfix: '.xml' });
  fs.writeFileSync(tempFile.name, xmlBuffer);

  try {
    const result = await pdp.sendInvoice({ invoiceLocalId: invoiceId, filePath: tempFile.name });

    // ✅ Envoi réussi → statut validated
    const submissionId = result?.id || result?.submissionId || null;
    await InvoiceStatusModel.updateTechnicalStatus(invoiceId, {
      technicalStatus: 'validated',
      submissionId,
    });

    logger.info(`[IopoleAdapter] 🟢 Facture ${invoiceId} envoyée avec succès → submissionId: ${submissionId}`);

    res.json({
      success: true,
      message: 'Facture envoyée avec succès au PDP',
      invoiceId,
      submissionId,
      provider,
      result,
    });
  } catch (error) {
    logger.error(`[IopoleAdapter] 🔴 Erreur envoi facture ${invoiceId}:`, error.message);

    // ❌ Échec → statut rejected
    await InvoiceStatusModel.updateTechnicalStatus(invoiceId, {
      technicalStatus: 'rejected',
      submissionId: null,
    });

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l’envoi au PDP',
      invoiceId,
      provider,
      error,
    });
  } finally {
    // Supprime le fichier temporaire
    tempFile.removeCallback();
  }
});

const getInvoiceStatus = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const invoice = await InvoicesService.getInvoiceById(invoiceId);

  if (!invoice) {
    return res.status(404).json({ message: 'Facture introuvable' });
  }

  const provider = process.env.PDP_PROVIDER || 'mock';
  const pdp = new PDPService(provider);

  // récupère le statut courant depuis le PDP
  const pdpStatus = await pdp.fetchStatus(invoice.submission_id); 
  res.json({
    technicalStatus: invoice.technical_status || 'pending',
    pdpStatus: pdpStatus || null
  });
});

const refreshInvoiceStatus = asyncHandler(async (req, res) => {
  logger.info(`[refreshInvoiceStatus] invoiceId=${req.params.id}`);

  const invoiceId = req.params.id;
  const invoice = await InvoicesService.getInvoiceById(invoiceId);

  if (!invoice) return res.status(404).json({ message: 'Facture introuvable' });
  if (!invoice.submission_id) return res.status(400).json({ message: 'Facture non encore envoyée au PDP' });

  const provider = process.env.PDP_PROVIDER || 'mock';
  const pdp = new PDPService(provider);

  // Récupère le dernier statut depuis l’adapter (mock ou réel)
  logger.info('[refreshInvoiceStatus] Appel PDPService.fetchStatus pour', invoice.submission_id);
  const lastStatus = await pdp.fetchStatus(invoice.submission_id);

  res.json({
    invoiceId,
    lastStatus,
    technicalStatus: invoice.technical_status,
  });
});

/**
 * Récupérer l'historique complet des statuts métier
 */
const getInvoiceLifecycle = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const invoice = await InvoicesService.getInvoiceById(invoiceId);
  if (!invoice) return res.status(404).json({ message: 'Facture introuvable' });
  if (!invoice.submission_id) return res.status(400).json({ message: 'Facture non encore envoyée au PDP' });

  const lifecycle = await InvoicePdpService.getPdpLifecycle(invoice.submission_id);
  res.json({ invoiceId, lifecycle });
});

/**
 * Marquer une facture comme encaissée
 */
const markInvoicePaid = asyncHandler(async (req, res) => {
  const invoiceId = req.params.id;
  const invoice = await InvoicesService.getInvoiceById(invoiceId);

  if (!invoice) {
    const err = new Error('Facture introuvable');
    err.statusCode = 404;
    throw err;
  }

  if (!invoice.submission_id) {
    const err = new Error("La facture n'a pas encore été soumise au PDP");
    err.statusCode = 400;
    throw err;
  }

  const newStatus = { code: 212, label: 'Encaissement constaté' };

  // 1️⃣ Notifier le PDP (mock ou réel)
  const pdpProvider = process.env.PDP_PROVIDER || 'mock';
  const pdp = new PDPService(pdpProvider);

  // Mapper le code interne vers le code attendu par le PDP selon le provider
  const codeMapping = {
    mock: 212,
    iopole: 'PAYMENT_RECEIVED',
  };

  const pdpPayload = {
    code: codeMapping[pdpProvider] || newStatus.code,
    message: 'Facture encaissée',
  };

  try {
    const pdpResponse = await pdp.sendStatus(invoice.submission_id, pdpPayload);

    if (!pdpResponse?.success) {
      const error = new Error('La plateforme de facturation n’a pas accepté l’encaissement, réessayez plus tard');
      error.statusCode = 502;
      throw error;
    }
  } catch (err) {
    if (err.isAxiosError) {
      const error = new Error('La plateforme de facturation est indisponible, réessayez plus tard');
      error.statusCode = 502;
      throw error;
    }
    throw err;
  }

  // 2️⃣ Mettre à jour uniquement le statut business dans notre DB
  await InvoiceStatusModel.updateBusinessStatus(invoiceId, {
    statusCode: newStatus.code,
    statusLabel: newStatus.label,
  });

  res.json({ message: 'Facture encaissée', invoiceId, newStatus });
});

const getInvoiceStatusComment = asyncHandler(async (req, res) => {
  const { id, statusCode } = req.params;
  const comment = await InvoicesService.getInvoiceStatusComment(id, statusCode);
  res.json({ comment });
});

const storageService = require('../../services');
const getInvoicePdfA3Url = async (req, res) => {
  try {
    const { id } = req.params;

    // Nom de fichier standardisé
    const fileName = `${id}_pdf-a3.pdf`;

    // Récupération de l’URL depuis le service de stockage
    const url = await storageService.getPublicUrl(`pdf-a3/${fileName}`);

    if (!url) {
      return res.status(404).json({ message: "PDF/A-3 non trouvé" });
    }

    res.json({ url });
  } catch (err) {
    logger.error("[getInvoicePdfA3Url]", err);
    res.status(500).json({ message: "Erreur lors de la récupération de l'URL du PDF/A-3" });
  }
};

const { Readable, pipeline } = require('stream');
const { promisify } = require('util');
const pipe = promisify(pipeline);
const getInvoicePdfA3Proxy = async (req, res) => {
  try {
    const { id } = req.params;
    const fileName = `${id}_pdf-a3.pdf`;
    logger.info('[PDF Proxy] Requête pour PDF/A-3 id =', id);

    // 🔹 Mode LOCAL
    if (process.env.STORAGE_BACKEND === 'local') {
      const filePath = path.join(__dirname, '../../uploads/pdf-a3', fileName);
      logger.info('[PDF Proxy] Mode LOCAL, chemin fichier =', filePath);

      if (!fs.existsSync(filePath)) {
        logger.warn('[PDF Proxy] Fichier non trouvé en local');
        return res.status(404).json({ message: 'PDF/A-3 non trouvé en local' });
      }

      const stats = fs.statSync(filePath);
      logger.info('[PDF Proxy] Taille fichier local =', stats.size, 'octets');

      return res.sendFile(filePath);
    }

    // 🔹 Mode B2
    if (process.env.STORAGE_BACKEND === 'b2') {
      const relativePath = `pdf-a3/${fileName}`;
      logger.info('[PDF Proxy] Mode B2, récupération du fichier via storageService');
      logger.info('[PDF Proxy] Clé demandée B2 =', relativePath);

      const data = await storageService.get(relativePath); // Buffer
      logger.info('[PDF Proxy] Buffer reçu depuis B2, longueur =', data?.length);

      if (!data || !data.length) {
        logger.warn('[PDF Proxy] Aucun contenu récupéré depuis B2');
        return res.status(404).json({ message: 'PDF/A-3 non trouvé sur B2' });
      }

      const stream = Readable.from(data);
      logger.info('[PDF Proxy] Stream créé, envoi vers le client');

      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Type', 'application/pdf');

      // 🔹 Utilisation de pipeline pour éviter les flux incomplets
      await pipe(stream, res);
      return;
    }

    logger.error('[PDF Proxy] Storage backend non configuré');
    return res.status(500).json({ message: 'Storage backend non configuré' });

  } catch (err) {
    logger.error('[PDF Proxy] Erreur lors de la récupération du PDF/A-3 :', err);
    res.status(500).json({ message: 'Erreur lors de la récupération du PDF/A-3' });
  }
};

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice, 
  deleteInvoice,
  createInvoicePdf,
  generateInvoicePdfBuffer,
  getInvoices,
  sendInvoice,
  getInvoiceStatus,
  refreshInvoiceStatus,
  getInvoiceLifecycle,
  markInvoicePaid,
  getInvoiceStatusComment,
  getInvoicePdfA3Url,
  getInvoicePdfA3Proxy
};
