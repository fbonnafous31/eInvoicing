// src/constants/paymentMethods.js
const paymentMethodsOptions = [
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'direct_debit', label: 'Prélèvement automatique' },
  { value: 'credit_card', label: 'Carte bancaire' },
  { value: 'check', label: 'Chèque' },
  { value: 'cash', label: 'Espèces' },
  { value: 'online_platform', label: 'Plateforme de paiement en ligne' },
  { value: 'advance', label: 'Paiement anticipé' },
  { value: 'upon_receipt', label: 'À réception de la marchandise' },
];

module.exports = { paymentMethodsOptions };
