// utils/validators/phone_number.js

/**
 * Vérifie si un numéro de téléphone est valide.
 * Non obligatoire : champ vide accepté.
 */
export function validatePhoneNumber(phoneValue) {
  if (!phoneValue) return null; // vide accepté

  const regex = /^\+?[0-9\s-]{6,20}$/;
  if (!regex.test(phoneValue)) return "Numéro de téléphone invalide";

  return null; // valide
}
