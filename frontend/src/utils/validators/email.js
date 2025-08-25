// frontend/src/utils/validators/email.js

/**
 * Vérifie si une chaîne est un email valide
 * @param {string} email
 * @returns {string|null} message d'erreur ou null si valide
 */
export function validateEmail(email) {
  if (!email || !email.trim()) return "L'email est obligatoire";

  // regex simple mais efficace pour la plupart des emails
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) return "Format d'email invalide";

  return null; // valide
}

/**
 * Vérifie si une chaîne est un email facultatif mais valide si renseigné
 * @param {string} email
 * @returns {string|null}
 */
export function validateOptionalEmail(email) {
  if (!email || !email.trim()) return null; // vide = ok
  return validateEmail(email);
}
