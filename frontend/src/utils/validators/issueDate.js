// utils/validators/issueDate.js

/**
 * Valide la date d'émission d'une facture.
 * Non obligatoire : si vide, la date du jour sera utilisée.
 * Retourne un message d'erreur si invalide, sinon null.
 */
export function validateIssueDate(dateValue) {
  if (!dateValue) return null; // vide accepté, on mettra la date du jour par défaut

  const date = new Date(dateValue);
  if (isNaN(date)) return "Date d'émission invalide";

  const today = new Date();
  const pastLimit = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
  const futureLimit = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());

  if (date < pastLimit || date > futureLimit) {
    return "Date d'émission hors limites recommandées (±1 an par rapport à aujourd'hui)";
  }

  return null; // date valide
}
