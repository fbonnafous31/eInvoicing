/* eslint-disable */

// src/modules/pdp/PDPInterface.js

/**
 * @interface PDPInterface
 * Interface pour la communication avec une Plateforme de Dématérialisation Partenaire (PDP)
 */
class PDPInterface {
  /**
   * Envoie une facture vers la PDP
   * @param {Object} payload
   * @param {string} payload.filePath - Chemin du fichier (PDF Factur-X ou XML)
   * @param {string} payload.fileType - Type du fichier ("facturx" | "ubl" | "cii")
   * @param {string} payload.invoiceLocalId - ID interne de la facture (dans ta DB)
   * @returns {Promise<{ type: string, id: string }>} - Identifiant renvoyé par la PDP
   */
  async sendInvoice(payload) {
    throw new Error('sendInvoice() must be implemented');
  }

  /**
   * Envoie un statut de facture à la PDP (ex: PAYÉ)
   * @param {string} invoicePdpId - ID de la facture attribué par la PDP
   * @param {Object} payload
   * @param {string} payload.code - Code de statut (ex: "PAID", "SENT", etc.)
   * @param {string} [payload.comment] - Commentaire optionnel ou note explicative
   * @param {Date} [payload.date] - Date d’émission du statut
   * @returns {Promise<{ success: boolean, message?: string }>}
   */
  async sendStatus(invoicePdpId, payload) {
    throw new Error('sendStatus() must be implemented');
  }

  /**
   * Récupère l’historique des statuts d’une facture
   * @param {string} invoicePdpId - ID de la facture attribué par la PDP
   * @returns {Promise<Array<{ code: string, label?: string, date: string }>>}
   * Exemple de retour :
   * [
   *   { code: "received", label: "Facture reçue", date: "2025-10-07T12:32:00Z" },
   *   { code: "validated", label: "Facture validée", date: "2025-10-07T14:10:00Z" }
   * ]
   */
  async fetchStatusHistory(invoicePdpId) {
    throw new Error('fetchStatusHistory() must be implemented');
  }
}

module.exports = PDPInterface;
