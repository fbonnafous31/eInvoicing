const InvoicesService = require('./invoices.service');
const { getInvoiceById } = require('./invoices.model');
const { generateInvoicePdf, generateInvoicePdfBuffer: generatePdfUtil } = require('../../utils/invoice-pdf/generateInvoicePdf');
const path = require("path");
const axios = require('axios');

/**
 * Liste toutes les factures
 */
async function listInvoices(req, res) {
  try {
    const invoices = await InvoicesService.listInvoices();
    res.json(invoices);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

/**
 * Récupère une facture par ID
 */
async function getInvoice(req, res) {
  try {
    const invoice = await InvoicesService.getInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ message: 'Facture non trouvée' });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
}

/**
 * Crée une facture avec lignes, taxes et justificatifs
 */
async function createInvoice(req, res, next) {
  try {
    const invoiceData = req.body.invoice ? JSON.parse(req.body.invoice) : null;
    const lines = req.body.lines ? JSON.parse(req.body.lines) : null;
    const taxes = req.body.taxes ? JSON.parse(req.body.taxes) : null;
    const attachmentsMeta = req.body.attachments_meta ? JSON.parse(req.body.attachments_meta) : [];
    const client = req.body.client ? JSON.parse(req.body.client) : null;

    const attachments = (req.files.attachments || []).map((file, i) => ({
      file_name: file.originalname,
      file_path: file.path,
      attachment_type: attachmentsMeta[i]?.attachment_type || 'additional'
    }));

    const mainCount = attachments.filter(f => f.attachment_type === 'main').length;
    if (mainCount !== 1) {
      // Vérification que invoiceData existe
      if (!invoiceData) {
        return res.status(400).json({ message: "Invoice data is missing." });
      }


      return res.status(400).json({ message: "Une facture doit avoir un justificatif principal." });
    }

    const newInvoice = await InvoicesService.createInvoice({
      invoice: invoiceData,
      client: client,
      lines,
      taxes,
      attachments
    });

    res.status(201).json(newInvoice);

  } catch (err) {
    console.error("=== Error creating invoice ===", err);
    if (err.message.includes("déjà utilisé")) return res.status(409).json({ message: err.message });
    if (err.message.includes("exercice")) return res.status(400).json({ message: err.message });
    next(err);
  }
}

/**
 * Supprime une facture par ID
 */
async function deleteInvoice(req, res) {
  try {
    const deleted = await InvoicesService.deleteInvoice(req.params.id);
    if (!deleted) {
      return res.status(400).json({ message: 'Facture non trouvée ou non en draft' });
    }
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression de la facture' });
  }
}

/**
 * Met à jour une facture avec lignes, taxes et justificatifs
 */
async function updateInvoice(req, res, next) {
  try {
    // Vérifier si la facture existe et son technical_status
    const existingInvoice = await InvoicesService.getInvoiceById(req.params.id);
    if (!existingInvoice) {
      return res.status(404).json({ message: "Facture introuvable" });
    }

    const ts = existingInvoice.technical_status?.toLowerCase();
    const bs = existingInvoice.business_status;
    if (ts && !["draft", "pending"].includes(ts)) {
      if (bs !== "208") {
        // Bloc classique : interdiction de modifier
        return res.status(403).json({ message: "Cette facture ne peut pas être modifiée." });
      }
    }

    // Parser les champs JSON en toute sécurité
    let invoiceData = null;
    let client = null;
    let lines = [];
    let taxes = [];
    let attachmentsMeta = [];
    let existingAttachments = [];

    try { if (req.body.invoice) invoiceData = JSON.parse(req.body.invoice); } 
    catch(e) { 
      console.error("❌ Failed to parse invoice:", req.body.invoice);
      return res.status(400).json({ message: "Invoice data is not valid JSON" }); 
    }

    try { if (req.body.client) client = JSON.parse(req.body.client); } 
    catch(e) { 
      console.error("❌ Failed to parse client:", req.body.client);
      return res.status(400).json({ message: "Client data is not valid JSON" }); 
    }

    try { if (req.body.lines) lines = JSON.parse(req.body.lines); } 
    catch(e) { 
      console.error("❌ Failed to parse lines:", req.body.lines);
      return res.status(400).json({ message: "Lines data is not valid JSON" }); 
    }

    try { if (req.body.taxes) taxes = JSON.parse(req.body.taxes); } 
    catch(e) { 
      console.error("❌ Failed to parse taxes:", req.body.taxes);
      return res.status(400).json({ message: "Taxes data is not valid JSON" }); 
    }

    try { if (req.body.attachments_meta) attachmentsMeta = JSON.parse(req.body.attachments_meta); } 
    catch(e) { 
      console.error("❌ Failed to parse attachments_meta:", req.body.attachments_meta);
      return res.status(400).json({ message: "Attachments meta is not valid JSON" }); 
    }

    try { if (req.body.existing_attachments) existingAttachments = JSON.parse(req.body.existing_attachments); } 
    catch(e) { 
      console.error("❌ Failed to parse existing_attachments:", req.body.existing_attachments);
      return res.status(400).json({ message: "Existing attachments is not valid JSON" }); 
    }

    // Construire la liste complète des attachments
    const newAttachments = (req.files?.attachments || []).map((file, i) => ({
      file_name: file.originalname,
      file_path: file.path,
      attachment_type: attachmentsMeta[i]?.attachment_type || "additional"
    }));

    const allAttachments = [...existingAttachments, ...newAttachments];

    const updatedInvoice = await InvoicesService.updateInvoice(req.params.id, {
      invoice: invoiceData,
      client,
      lines,
      taxes,
      attachments: allAttachments
    });

    res.status(200).json(updatedInvoice);

  } catch (err) {
    console.error("=== Error updating invoice ===", err);
    next(err);
  }
}

async function createInvoicePdf(req, res) {
  try {
    const invoiceId = req.params.id;
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
      console.log("❌ Facture introuvable pour id:", invoiceId);
      return res.status(404).json({ error: "Facture introuvable" });
    }

    const pdfPath = await generateInvoicePdf(invoice);
    console.log("✅ PDF généré sur le serveur :", pdfPath);

    const fileName = path.basename(pdfPath);
    const publicPath = `/uploads/pdf/${fileName}`;
    console.log("📎 URL publique renvoyée :", publicPath);

    res.json({ path: publicPath });
  } catch (err) {
    console.error("❌ Erreur dans createInvoicePdf:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

const { getSellerById } = require('../sellers/sellers.service'); // adapte le chemin

async function generateInvoicePdfBuffer(req, res) {
  try {
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

  } catch (err) {
    console.error("Erreur génération PDF:", err);
    res.status(500).json({ error: 'Impossible de générer le PDF' });
  }
}

async function getInvoices(req, res, next) {
  try {
    if (!req.seller) {
      return res.status(403).json({ message: 'Vendeur non trouvé' });
    }

    const invoices = await InvoicesService.getInvoicesBySeller(req.seller.id);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
}

async function sendInvoice(req, res, next) {
  try {
    const invoiceId = req.params.id;

    if (!invoiceId) {
      return res.status(400).json({ error: 'ID de facture manquant' });
    }

    const invoice = await InvoicesService.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Facture introuvable' });
    }

    const result = await InvoicesService.sendInvoice(invoiceId);

    res.json({
      message: 'Facture envoyée avec succès',
      invoiceId,
      submissionId: result.submissionId,
      result, 
    });
  } catch (err) {
    console.error('Erreur sendInvoice:', err);
    next(err); 
  }
};

async function getInvoiceStatus(req, res, next) {
  try {
    const invoiceId = req.params.id;
    const invoice = await InvoicesService.getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: 'Facture introuvable' });
    }

    // Retourner le statut technique uniquement
    res.json({ technicalStatus: invoice.technical_status || 'pending' });
  } catch (err) {
    console.error('Erreur getInvoiceStatus:', err);
    next(err);
  }
}

async function refreshInvoiceStatus(req, res, next) {
  try {
    const invoiceId = req.params.id;
    const invoice = await InvoicesService.getInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Facture introuvable' });
    if (!invoice.submission_id) return res.status(400).json({ message: 'Facture non encore envoyée au PDP' });

    // Avancer le cycle métier côté mock PDP
    const pduResponse = await axios.post(
      `http://localhost:4000/invoices/${invoice.submission_id}/lifecycle/request`
    );
    const lifecycle = pduResponse.data.lifecycle || [];

    // Mettre à jour le cycle complet dans la DB
    await InvoicesService.updateInvoiceLifecycle(invoiceId, lifecycle);

    // Dernier statut métier
    const lastStatus = lifecycle[lifecycle.length - 1] || { code: null, label: 'Non renseigné' };

    // Si le dernier code est 211 (Paiement transmis), passer à 212
    if (lastStatus.code === 211) {
      await InvoicesService.updateInvoice(invoiceId, { business_status: 212 });
      lastStatus.code = 212;
      lastStatus.label = 'Encaissée';
    }

    res.json({
      invoiceId,
      lastStatus,
      lifecycle
    });
  } catch (err) {
    console.error('Erreur refreshInvoiceStatus:', err);
    next(err);
  }
}

/**
 * Récupérer l'historique complet des statuts métier
 */
async function getInvoiceLifecycle(req, res, next) {
  try {
    const invoiceId = req.params.id;
    const invoice = await InvoicesService.getInvoiceById(invoiceId);

    if (!invoice) {
      return res.status(404).json({ message: 'Facture introuvable' });
    }

    if (!invoice.submission_id) {
      return res.status(400).json({ message: 'Facture non encore envoyée au PDP' });
    }

    // Appel au Mock PDP pour récupérer l'historique
    const pduResponse = await axios.get(`http://localhost:4000/invoices/${invoice.submission_id}/lifecycle`);

    res.json({
      invoiceId,
      lifecycle: pduResponse.data.lifecycle
    });
  } catch (err) {
    console.error('Erreur getInvoiceLifecycle:', err);
    next(err);
  }
}

/**
 * Marquer une facture comme encaissée
 */
async function markInvoicePaid(req, res, next) {
  try {
    const invoiceId = req.params.id;

    const invoice = await InvoicesService.getInvoiceById(invoiceId);
    if (!invoice) return res.status(404).json({ message: 'Facture introuvable' });

    // Forcer le statut 212 en DB
    const newStatus = {
      code: '212',
      label: 'Encaissement constaté',
      date: new Date(),
    };

    const lifecycle = Array.isArray(invoice.lifecycle) ? [...invoice.lifecycle] : [];
    lifecycle.push(newStatus);

    await InvoicesService.updateInvoiceLifecycle(invoiceId, lifecycle);

    // Envoyer la request au mock, sans contrôle de sa réponse
    axios.post(
      `http://localhost:4000/invoices/sub_${invoiceId}_${invoice.timestamp}/lifecycle/request`,
      { status: newStatus.code, label: newStatus.label },
      { headers: { 'Content-Type': 'application/json' } }
    )
    .then(() => {
      console.log(`📤 Envoi mock PDP - invoice ${invoiceId} : status=${newStatus.code}, label="${newStatus.label}"`);
    })
    .catch(() => {
      console.log(`ℹ️ Mock PDP invoqué pour invoice ${invoiceId}, réponse ignorée`);
    });

    res.json({ message: 'Facture encaissée', invoiceId, lifecycle, newStatus });

  } catch (err) {
    console.error('Erreur markInvoicePaid:', err);
    next(err);
  }
}

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
  markInvoicePaid
};
