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
 * Crée une facture avec lignes, taxes et justificatifs uploadés
 */
async function createInvoice(req, res) {
  try {
    let attachmentsMeta = [];
    try {
      attachmentsMeta = JSON.parse(req.body.attachments_meta || '[]');
    } catch {}

    const attachments = (req.files || []).map((file, i) => ({
      file_name: file.originalname,
      file_path: file.path,
      attachment_type: attachmentsMeta[i]?.attachment_type || 'additional'
    }));

    // --- Validation principale des justificatifs ---
    const mainCount = attachments.filter(f => f.attachment_type === 'main').length;
    if (mainCount !== 1) {
      return res.status(400).json({ message: "Une facture doit avoir un justificatif principal." });
    }

    // Récupération des autres données
    const invoiceData = JSON.parse(req.body.invoice || '{}');
    const lines = JSON.parse(req.body.lines || '[]');
    const taxes = JSON.parse(req.body.taxes || '[]');

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

    res.status(500).json({ message: err.message || 'Erreur interne serveur' });
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
