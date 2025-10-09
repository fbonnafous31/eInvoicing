const fs = require('fs');
const InvoicesService = require('./invoices.service');
const InvoicePdpService = require('./invoicePdp.service');
const PDPService = require('../pdp/PDPService');
const { getInvoiceById } = require('./invoices.model');
const { generateInvoicePdf, generateInvoicePdfBuffer: generatePdfUtil } = require('../../utils/invoice-pdf/generateInvoicePdf');
const InvoiceStatusModel = require('../invoices/invoiceStatus.model');
const path = require("path");

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
        console.error(`Erreur parsing ${key}:`, e.message); 
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

  const pdfPath = await generateInvoicePdf(invoice);
  const fileName = path.basename(pdfPath);
  const publicPath = `/uploads/pdf/${fileName}`;

  res.json({ path: publicPath });
});

const { getSellerById } = require('../sellers/sellers.service'); // adapte le chemin

const generateInvoicePdfBuffer = asyncHandler(async (req, res) => {
    const invoiceBody = { ...req.body };

    // ---------------- Récupérer le seller complet ----------------
    let seller = {};
    const sellerId = invoiceBody.header?.seller_id;
    if (sellerId) {
      seller = await getSellerById(sellerId); 
    }

    // ---------------- Composer l'objet invoice complet ----------------
    const invoice = {
      ...invoiceBody,
      seller
    };

    const pdfBytes = await generatePdfUtil(invoice); 

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename=facture_preview.pdf');
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
  if (!invoice) return res.status(404).json({ error: 'Facture introuvable' });

  const finalPdfPath = path.join(__dirname, `../../uploads/pdf-a3/${invoiceId}_pdf-a3.pdf`);
  if (!fs.existsSync(finalPdfPath)) {
    return res.status(404).json({ 
      error: `Le fichier PDF/A-3 final pour la facture ${invoiceId} est introuvable.` 
    });
  }

  const provider = process.env.PDP_PROVIDER || 'mock';
  const pdp = new PDPService(provider);

  const result = await pdp.sendInvoice({ invoiceLocalId: invoiceId, filePath: finalPdfPath });

  // Mise à jour DB avec statut initial seulement
  if (result.submissionId) {
    const initialStatus = provider === 'mock' ? 'received' : 'sent';
    await InvoiceStatusModel.updateTechnicalStatus(invoiceId, {
      technicalStatus: initialStatus,
      submissionId: result.submissionId
    });
  }

  res.json({
    message: provider === 'mock'
      ? 'Facture envoyée et suivie via mock'
      : 'Facture envoyée mais le statut technique ne peut pas être suivi pour l’instant',
    invoiceId,
    result
  });
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
  console.log(`[refreshInvoiceStatus] invoiceId=${req.params.id}`);

  const invoiceId = req.params.id;
  const invoice = await InvoicesService.getInvoiceById(invoiceId);

  if (!invoice) return res.status(404).json({ message: 'Facture introuvable' });
  if (!invoice.submission_id) return res.status(400).json({ message: 'Facture non encore envoyée au PDP' });

  const provider = process.env.PDP_PROVIDER || 'mock';
  const pdp = new PDPService(provider);

  // Récupère le dernier statut depuis l’adapter (mock ou réel)
  console.log('[refreshInvoiceStatus] Appel PDPService.fetchStatus pour', invoice.submission_id);
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
      const err = new Error('La facture n\'a pas encore été soumise au PDP');
      err.statusCode = 400;
      throw err;
  }

  const newStatus = { code: 212, label: 'Encaissement constaté' };

  // 1. Notifier le PDP du nouvel état
  try {
    const pdpData = await InvoicePdpService.requestPdpStatusUpdate(
      invoice.submission_id,
      { status: newStatus.code, label: newStatus.label }
    );

    if (!pdpData || pdpData.businessStatus !== 211) {
      const error = new Error('La plateforme de facturation n’a pas accepté l’encaissement, réessayez plus tard');
      error.statusCode = 502; // Bad Gateway
      throw error;
    }
  } catch (err) {
    if (err.isAxiosError) {
      const error = new Error('La plateforme de facturation est indisponible, réessayez plus tard');
      error.statusCode = 502;
      throw error;
    }
    throw err; // Re-throw other errors
  }

  // 2. Mettre à jour le statut dans notre base de données
  await InvoicePdpService.updateInvoiceLifecycle(invoiceId, [newStatus]);
  res.json({ message: 'Facture encaissée', invoiceId, newStatus });
});

const getInvoiceStatusComment = asyncHandler(async (req, res) => {
  const { id, statusCode } = req.params;
  const comment = await InvoicesService.getInvoiceStatusComment(id, statusCode);
  res.json({ comment });
});

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
  getInvoiceStatusComment
};
