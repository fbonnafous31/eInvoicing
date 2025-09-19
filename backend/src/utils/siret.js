// src/utils/siret.js
function isValidSiret(siret) {
  if (!/^\d{14}$/.test(siret)) return false;

  // Algorithme de Luhn
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    let digit = parseInt(siret[i], 10);
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

module.exports = { isValidSiret };
