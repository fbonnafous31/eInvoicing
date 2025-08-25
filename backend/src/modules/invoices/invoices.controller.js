const InvoicesService = require('./invoices.service');

/**
 * Validation des données client selon le type
 */
function validateInvoiceClient(client) {
  const errors = {};
  if (!client) return errors;

  switch (client.client_type) {
    case 'individual':
      if (!client.first_name) errors.first_name = 'Prénom requis';
      if (!client.last_name) errors.last_name = 'Nom requis';
      if (!client.address) errors.address = 'Adresse requise';
      break;
    case 'company_fr':
      if (!client.legal_name) errors.legal_name = 'Raison sociale requise';
      if (!client.siret) errors.siret = 'SIRET requis';
      if (!client.address) errors.address = 'Adresse requise';
      break;
    case 'company_eu':
      if (!client.legal_name) errors.legal_name = 'Raison sociale requise';
      if (!client.vat_number) errors.vat_number = 'TVA intracommunautaire requise';
      if (!client.address) errors.address = 'Adresse requise';
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
 * Crée une facture avec client, lignes, taxes et justificatifs
 */
async function createInvoice(req, res, next) {
  try {
    console.log("=== Incoming request ===");
    console.log("req.files:", req.files);
    console.log("req.body keys:", Object.keys(req.body));

    // Champs JSON
    const invoiceData = req.body.invoice ? JSON.parse(req.body.invoice) : {};
    const clientData = req.body.client ? JSON.parse(req.body.client) : {};

    const client = {
      ...clientData,
      legal_name: clientData.client_legal_name || clientData.legal_name,
      first_name: clientData.client_first_name || clientData.first_name,
      last_name: clientData.client_last_name || clientData.last_name,
      siret: clientData.client_siret || clientData.siret,
      vat_number: clientData.client_vat_number || clientData.vat_number,
      address: clientData.client_address || clientData.address,
      city: clientData.client_city || clientData.city,
      postal_code: clientData.client_postal_code || clientData.postal_code,
      country_code: clientData.client_country_code || clientData.country_code,
      email: clientData.client_email || clientData.email,
      phone: clientData.client_phone || clientData.phone
    };

    const lines = req.body.lines ? JSON.parse(req.body.lines) : [];
    const taxes = req.body.taxes ? JSON.parse(req.body.taxes) : [];
    const attachmentsMeta = req.body.attachments_meta ? JSON.parse(req.body.attachments_meta) : [];

    console.log({ invoiceData, client, lines, taxes, attachmentsMeta });

    // Fichiers
    const attachments = (req.files.attachments || []).map((file, i) => ({
      file_name: file.originalname,
      file_path: file.path,
      attachment_type: attachmentsMeta[i]?.attachment_type || 'additional'
    }));

    const mainCount = attachments.filter(f => f.attachment_type === 'main').length;
    if (mainCount !== 1) {
      return res.status(400).json({ message: "Une facture doit avoir un justificatif principal." });
    }

    // --- Validation client ---
    const clientErrors = validateInvoiceClient(client);
    if (Object.keys(clientErrors).length > 0) {
      return res.status(400).json({ message: "Erreur sur les données client", errors: clientErrors });
    }

    // --- Création de la facture ---
    const newInvoice = await InvoicesService.createInvoice({
      invoice: invoiceData,
      client: client,
      lines,
      taxes,
      attachments
    });

    console.log("=== Invoice created successfully ===", newInvoice);

    res.status(201).json(newInvoice);

  } catch (err) {
    console.error("=== Error creating invoice ===", err);

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
