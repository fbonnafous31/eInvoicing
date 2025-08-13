export function isValidSiret(siret) {
  // Enlever tous les espaces
  const cleaned = siret.replace(/\s+/g, '');

  // Vérifier qu'il y a exactement 14 chiffres
  if (!/^\d{14}$/.test(cleaned)) return false;

  // Algorithme de Luhn pour valider le SIRET
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(cleaned[i], 10);
    if (i % 2 === 0) digit *= 2;
    if (digit > 9) digit -= 9;
    sum += digit;
  }
  return sum % 10 === 0;
}
