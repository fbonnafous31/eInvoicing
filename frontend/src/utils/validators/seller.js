// utils/validators/seller.js
import { isValidSiret } from './siret';
import { validateContact } from './contact';
import IBAN from 'iban';
import { isValidPostalCode } from './postal_code';

/**
 * Validation d'un vendeur (toujours une entreprise)
 * @param {Object} data - Les données du formulaire
 * @returns {Object} errors - Objet des erreurs de validation
 */
export function validateSeller(data) {
  const errors = {};

  // ---------------------
  // Validation légale
  // ---------------------
  if (!data.legal_name?.trim()) {
    errors.legal_name = 'Le nom légal est obligatoire';
  }

  if (!data.legal_identifier?.trim()) {
    errors.legal_identifier = 'Identifiant légal obligatoire';
  }

  // Contrôle SIRET pour entreprises françaises
  if (data.country_code === 'FR') {
    const siret = (data.legal_identifier || '').replace(/\D/g, '');
    if (!siret) {
      errors.legal_identifier = 'Le SIRET est requis pour une entreprise française';
    } else if (siret.length !== 14) {
      errors.legal_identifier = 'Le SIRET doit contenir 14 chiffres';
    } else if (!isValidSiret(siret)) {
      errors.legal_identifier = 'SIRET invalide';
    }
  } else if (!data.vat_number?.trim()) {
    errors.vat_number = 'Le numéro de TVA intracommunautaire est requis';
  }

  // ---------------------
  // Validation adresse
  // ---------------------
  if (!data.address?.trim()) {
    errors.address = 'L’adresse est obligatoire';
  }
  
  if (!data.postal_code?.trim()) {
    errors.postal_code = 'Le code postal est obligatoire';
  } else if (!isValidPostalCode(data.postal_code)) {
    errors.postal_code = 'Code postal invalide';
  }

  if (!data.city?.trim()) {
    errors.city = 'La ville est obligatoire';
  }

  // ---------------------
  // Validation banque
  // ---------------------
  if (data.iban && !IBAN.isValid(data.iban)) {
    errors.iban = 'IBAN invalide';
  }

  if (data.bic && !/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(data.bic)) {
    errors.bic = 'BIC invalide';
  }

  // ---------------------
  // Validation contact
  // ---------------------
  const contactErrors = validateContact(data, { emailField: 'contact_email', emailRequired: true });

  // Validation téléphone vendeur (optionnelle)
  if (data.phone_number?.trim() && !/^\+?[0-9\s\-()]{6,20}$/.test(data.phone_number)) {
    contactErrors.phone_number = 'Numéro de téléphone invalide';
  }

  return {
    ...errors,
    ...contactErrors,
  };
}
