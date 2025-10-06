// src/utils/formatters.js

/**
 * Formate un nombre en euros selon la convention française.
 * @param {number} value - Le montant à formater
 * @returns {string} Montant formaté avec le symbole €
 */
export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const number = Number(value);
  if (isNaN(number)) return "";
  return number.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
};

/**
 * Formate une date en JJ/MM/AAAA selon la convention française.
 * @param {string|Date} value - La date à formater
 * @returns {string} Date formatée ou chaîne vide si invalide
 */
export const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return ""; // renvoie '' si date invalide
  return date.toLocaleDateString("fr-FR");
};
