const PDPInterface = require('../PDPInterface');
const InvoiceStatusModel = require('../../invoices/invoiceStatus.model');
const InvoicesService = require('../../invoices/invoices.service');
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

  /**
   * Récupère le statut courant d’une facture (dernier statut technique)
   * @param {string} submissionId
   * @returns {Promise<{ code: string, label?: string, date: string }>}
   */
async fetchStatus(submissionId) {
  console.log('[MockPDPAdapter] fetchStatus called for', submissionId);

  // 🔹 Extraction de l'ID réel depuis le submissionId
  const invoiceId = parseInt(submissionId.split('_')[1], 10);
  const invoice = await InvoicesService.getInvoiceById(invoiceId);
  if (!invoice) {
    console.warn('[MockPDPAdapter] Facture introuvable en DB pour', submissionId);
    return null;
  }

  // 🔹 On ne simule un business status que si la facture est déjà techniquement "validated"
  if (invoice.technical_status !== 'validated') {
    console.log(`[MockPDPAdapter] Statut technique "${invoice.technical_status}"`);
    return {
      code: invoice.business_status || 202,
      label: invoice.business_status_label || 'Pending',
      date: invoice.updated_at ? invoice.updated_at.toISOString() : new Date().toISOString()
    };
  }

  // 🔹 Détermination du dernier code business connu
  const lastCode = invoice.business_status || 202;

  const possibleStatuses = [
    { code: 202, label: 'Reçue par la plateforme', probability: 1.0 },
    { code: 203, label: 'Mise à disposition', probability: 1.0 },
    { code: 204, label: 'Prise en charge', probability: 0.6 },
    { code: 205, label: 'Approuvée', probability: 0.6 },
    { code: 206, label: 'Approuvée partiellement', probability: 0.2 },
    { code: 207, label: 'En litige', probability: 0.2 },
    { code: 208, label: 'Suspendue', probability: 0.2 },
    { code: 210, label: 'Refusée', probability: 0.1 },
    { code: 211, label: 'Paiement transmis', probability: 1.0 },
  ];

  const statusesWithComment = [206, 207, 208, 210];
  const commentsByStatus = {
    206: [
      "Approbation partielle : montant inférieur à la facture",
      "Facture validée partiellement suite contrôle manuel"
    ],
    207: [
      "Litige : incohérence détectée sur le montant",
      "Litige client, vérification nécessaire"
    ],
    208: [
      "Facture suspendue pour vérification interne",
      "Suspension temporaire : documents manquants"
    ],
    210: [
      "Refusée : facture non conforme",
      "Refus PDP : erreur sur la référence client"
    ]
  };

  let newStatus = null;
  for (const candidate of possibleStatuses) {
    if (candidate.code <= lastCode) continue;
    if (Math.random() <= candidate.probability) {
      const comment = statusesWithComment.includes(candidate.code)
        ? commentsByStatus[candidate.code][Math.floor(Math.random() * commentsByStatus[candidate.code].length)]
        : null;

      // 🔹 Met à jour uniquement le business_status dans la DB
      await InvoiceStatusModel.updateBusinessStatus(invoiceId, {
        statusCode: candidate.code,
        statusLabel: candidate.label,
        clientComment: comment
      });

      console.log(`[MockPDPAdapter] 💼 Nouveau business_status simulé pour ${submissionId} → ${candidate.label}`);
      newStatus = { ...candidate, comment, createdAt: new Date().toISOString() };
      break;
    }
  }

  // 🔹 Retourne le nouveau statut simulé ou le dernier connu
  return newStatus || {
    code: invoice.business_status || 202,
    label: invoice.business_status_label || 'Pending',
    date: invoice.updated_at ? invoice.updated_at.toISOString() : new Date().toISOString()
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
