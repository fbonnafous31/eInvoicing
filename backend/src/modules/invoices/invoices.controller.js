const InvoicesService = require('./invoices.service');

/**
 * Validation des données client selon le type
 */
function validateInvoiceClient(client) {
  const errors = {};
  if (!client) return errors;

  switch (client.client_type) {
    case 'individual':
      if (!client.client_first_name) errors.client_first_name = 'Prénom requis';
      if (!client.client_last_name) errors.client_last_name = 'Nom requis';
      if (!client.client_address) errors.client_address = 'Adresse requise';
      break;
    case 'company_fr':
      if (!client.client_legal_name) errors.client_legal_name = 'Raison sociale requise';
      if (!client.client_siret) errors.client_siret = 'SIRET requis';
      if (!client.client_address) errors.client_address = 'Adresse requise';
      break;
    case 'company_eu':
      if (!client.client_legal_name) errors.client_legal_name = 'Raison sociale requise';
      if (!client.client_vat_number) errors.client_vat_number = 'TVA intracommunautaire requise';
      if (!client.client_address) errors.client_address = 'Adresse requise';
      break;
  }

  return errors;
}

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
 * Crée une facture avec lignes, taxes et justificatifs uploadés
 */
async function createInvoice(req, res, next) {
  try {
    console.log("req.files:", req.files);
    console.log("req.body.attachments_meta:", req.body.attachments_meta);
    console.log("req.body.invoice:", req.body.invoice);
    console.log("req.body.lines:", req.body.lines);
    console.log("req.body.taxes:", req.body.taxes);

    // --- Gestion des justificatifs ---
    let attachmentsMeta = [];
    try {
      attachmentsMeta = JSON.parse(req.body.attachments_meta || '[]');
    } catch {}

    const attachments = (req.files || []).map((file, i) => ({
      file_name: file.originalname,
      file_path: file.path,
      attachment_type: attachmentsMeta[i]?.attachment_type || 'additional'
    }));

    const mainCount = attachments.filter(f => f.attachment_type === 'main').length;
    if (mainCount !== 1) {
      return res.status(400).json({ message: "Une facture doit avoir un justificatif principal." });
    }

    // --- Récupération des données ---
    const invoiceData = JSON.parse(req.body.invoice || '{}');
    const lines = JSON.parse(req.body.lines || '[]');
    const taxes = JSON.parse(req.body.taxes || '[]');

    // --- Validation client ---
    const clientErrors = validateInvoiceClient(invoiceData);
    if (Object.keys(clientErrors).length > 0) {
      return res.status(400).json({ message: "Erreur sur les données client", errors: clientErrors });
    }

    // --- Création de la facture ---
    const newInvoice = await InvoicesService.createInvoice({
      invoice: invoiceData,
      lines,
      taxes,
      attachments
    });

    res.status(201).json(newInvoice);

  } catch (err) {
    console.error(err);

    if (err.message.includes("déjà utilisé")) {
      return res.status(409).json({ message: err.message });
    }
    if (err.message.includes("exercice")) {
      return res.status(400).json({ message: err.message });
    }

    next(err);
  }
}

/**
 * Supprime une facture par ID
 */
async function deleteInvoice(req, res) {
  try {
    const deleted = await InvoicesService.deleteInvoice(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Facture non trouvée' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la suppression de la facture' });
  }
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  deleteInvoice
};
