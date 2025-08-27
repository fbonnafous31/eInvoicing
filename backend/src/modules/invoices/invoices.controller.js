const InvoicesService = require('./invoices.service');

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
    console.log("req.body:", req.body);
    console.log("req.files:", req.files);

    const invoiceData = req.body.invoice ? JSON.parse(req.body.invoice) : null;
    const lines = req.body.lines ? JSON.parse(req.body.lines) : null;
    const taxes = req.body.taxes ? JSON.parse(req.body.taxes) : null;
    const attachmentsMeta = req.body.attachments_meta ? JSON.parse(req.body.attachments_meta) : [];
    console.log("Parsed client data:", req.body.client);
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

    console.log("Creating invoice with data:", { invoice: invoiceData, client, lines, taxes, attachments });
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
    if (!deleted) return res.status(404).json({ message: 'Facture non trouvée' });
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
    const invoiceData = req.body.invoice ? JSON.parse(req.body.invoice) : null;
    const lines = req.body.lines ? JSON.parse(req.body.lines) : null;
    const taxes = req.body.taxes ? JSON.parse(req.body.taxes) : null;
    const attachmentsMeta = req.body.attachments_meta ? JSON.parse(req.body.attachments_meta) : [];

    const attachments = (req.files.attachments || []).map((file, i) => ({
      file_name: file.originalname,
      file_path: file.path,
      attachment_type: attachmentsMeta[i]?.attachment_type || 'additional'
    }));

    const updatedInvoice = await InvoicesService.updateInvoice(req.params.id, {
      invoice: invoiceData,
      lines,
      taxes,
      attachments
    });

    res.status(200).json(updatedInvoice);

  } catch (err) {
    console.error("=== Error updating invoice ===", err);
    next(err);
  }
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice, 
  deleteInvoice
};
