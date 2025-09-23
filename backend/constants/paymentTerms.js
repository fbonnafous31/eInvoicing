// src/constants/paymentTerms.js
const paymentTermsOptions = [
  { value: '30_df', label: 'Paiement à 30 jours date de facture' },
  { value: 'immediate', label: 'Paiement comptant' },
  { value: '45_df', label: 'Paiement à 45 jours date de facture' },
  { value: '60_df', label: 'Paiement à 60 jours date de facture' },
  { value: '30_fdm', label: 'Paiement à 30 jours fin de mois' },
  { value: '45_fdm', label: 'Paiement à 45 jours fin de mois' },
  { value: '60_fdm', label: 'Paiement à 60 jours fin de mois' },
  { value: 'upon_receipt', label: 'Paiement à réception de la marchandise' },
  { value: 'advance', label: 'Paiement anticipé' },
  { value: 'bank_transfer', label: 'Paiement par virement bancaire' },
  { value: 'direct_debit', label: 'Paiement par prélèvement automatique' },
  { value: 'credit_card', label: 'Paiement par carte bancaire' },
  { value: 'check', label: 'Paiement par chèque' },
  { value: 'cash', label: 'Paiement en espèces' },
  { value: 'online_platform', label: 'Paiement via plateforme électronique' },
];

module.exports = { paymentTermsOptions };
