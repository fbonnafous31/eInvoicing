// Formate un nombre en euros selon la convention FR
export const formatCurrency = (value) =>
  value?.toLocaleString('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }) ?? '';

// Formate une date en JJ/MM/AAAA
export const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  return date.toLocaleDateString('fr-FR');
};
