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
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Récupère une facture par ID
 */
async function getInvoice(req, res) {
  try {
    const invoice = await InvoicesService.getInvoice(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Facture non trouvée' });
    res.json(invoice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

/**
 * Crée une facture avec lignes, taxes et justificatifs uploadés
 */
async function createInvoice(req, res) {
  try {
    // Les fichiers uploadés via multer
    const attachments = (req.files || []).map(file => ({
      file_name: file.originalname,
      file_path: file.path, // chemin réel sur le serveur
      attachment_type: 'additional' // ou 'main' selon ton frontend
    }));

    // Récupère les données de la facture, lines et taxes depuis le body
    // On suppose que ce sont des JSON stringify côté frontend
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
    res.status(500).json({ error: 'Erreur lors de la création de la facture' });
  }
}

/**
 * Supprime une facture par ID
 */
async function deleteInvoice(req, res) {
  try {
    const deleted = await InvoicesService.deleteInvoice(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Facture non trouvée' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur lors de la suppression de la facture' });
  }
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  deleteInvoice
};
