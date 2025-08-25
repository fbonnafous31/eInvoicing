export function isValidPostalCode(code) {
  if (!code) return true; // non obligatoire
  // France : 5 chiffres, 01000 à 99999
  return /^[0-9]{5}$/.test(code);
}
