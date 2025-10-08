const PDPInterface = require('../PDPInterface');
const InvoiceStatusModel = require('../../invoices/invoiceStatus.model');
const fs = require('fs');

class MockPDPAdapter extends PDPInterface {
  constructor() {
    super();
    this.technicalStatusByInvoice = {}; 
  }

  async sendInvoice({ filePath, invoiceLocalId }) {
    if (!fs.existsSync(filePath)) throw new Error('Fichier introuvable');

    const submissionId = `mock_${invoiceLocalId}_${Date.now()}`;
    // Statut initial uniquement
    this.technicalStatusByInvoice[submissionId] = {
      status: 'received',
      createdAt: new Date(),
      lifecycle: [{ code: 202, label: 'Créée', createdAt: new Date().toISOString() }],
    };

    console.log(`[MockPDPAdapter] 📥 Facture ${invoiceLocalId} reçue. SubmissionId: ${submissionId}`);

    // Changement final asynchrone
  setTimeout(async () => {
    const finalStatus = Math.random() < 0.8 ? 'validated' : 'rejected';
    this.technicalStatusByInvoice[submissionId].status = finalStatus;

    // Mise à jour DB pour refléter le statut final
    await InvoiceStatusModel.updateTechnicalStatus(invoiceLocalId, {
      technicalStatus: finalStatus,
      submissionId
    });

    console.log(`[MockPDPAdapter] ⏳ Traitement terminé pour ${submissionId} → ${finalStatus.toUpperCase()}`);
  }, 4000 + Math.random() * 3000);


    // Retour immédiat avec received
    return { status: 'received', submissionId };
  }

  async sendStatus(invoicePdpId, { code }) {
    console.log(`Mock sendStatus for ${invoicePdpId} => code ${code}`);
    return { success: true };
  }

  // eslint-disable-next-line no-unused-vars
  async fetchStatusHistory(_invoicePdpId) {
    // retourne les statuts métier disponibles
    return [
      { code: 203, label: 'Mise à disposition' },
      { code: 204, label: 'Prise en charge' },
      { code: 205, label: 'Approuvée' },
      { code: 206, label: 'Approuvée partiellement' },
      { code: 207, label: 'En litige' },
      { code: 208, label: 'Suspendue' },
      { code: 210, label: 'Refusée' },
      { code: 211, label: 'Paiement transmis' },
    ];
  }

  async getTechnicalStatus(submissionId) {
    // récupère le statut actuel
    let currentStatus = this.technicalStatusByInvoice[submissionId] || 'SENT';

    // évolution automatique : SENT → RECEIVED → VALIDATED
    switch (currentStatus) {
      case 'sent':
        currentStatus = 'received';
        break;
      case 'received':
        currentStatus = 'validated';
        break;
      case 'validated':
      default:
        currentStatus = 'validated';
    }

    // mémorise le nouveau statut
    this.technicalStatusByInvoice[submissionId] = currentStatus;

    // simulation d'un délai aléatoire pour le polling
    const randomDelay = Math.random() * 1000; // 0-1s
    await new Promise(res => setTimeout(res, randomDelay));

    return {
      submissionId,
      technicalStatus: currentStatus
    };
  }
}

module.exports = MockPDPAdapter;
