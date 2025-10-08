const { v4: uuidv4 } = require('uuid');
const PDPInterface = require('../PDPInterface');
const fs = require('fs');

class MockPDPAdapter extends PDPInterface {
  constructor() {
    super();
    this.technicalStatusByInvoice = {}; // stocke le statut technique par submissionId
  }

  async sendInvoice({ filePath, invoiceLocalId }) {
    if (!fs.existsSync(filePath)) throw new Error('Fichier introuvable');

    // Générer un submissionId factice pour le suivi
    const submissionId = uuidv4();

    // Initialiser le statut technique à SENT
    this.technicalStatusByInvoice[submissionId] = 'SENT';

    return {
      type: 'INVOICE',
      id: `mock-${invoiceLocalId}`,
      submissionId
    };
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
