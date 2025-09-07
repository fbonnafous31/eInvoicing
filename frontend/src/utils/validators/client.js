import { isValidSiret } from './siret';
import { validateContact } from './contact';
import { isValidPostalCode } from './postal_code';

export function validateClient(data) {
  const errors = {};

  const isCompany = data.is_company ?? true;

  // ---------------------
  // Validation légale
  // ---------------------
  if (isCompany) {
    if (!data.legal_name?.trim()) {
      errors.legal_name = 'Le nom légal est obligatoire';
    }

    if (data.country_code === 'FR') {
      const siret = (data.siret || '').replace(/\D/g, '');
      if (!siret) {
        errors.siret = 'Le SIRET est requis pour une entreprise française';
      } else if (siret.length !== 14) {
        errors.siret = 'Le SIRET doit contenir 14 chiffres';
      } else if (!isValidSiret(siret)) {
        errors.siret = 'SIRET invalide';
      }
    } else if (!data.vat_number?.trim()) {
      errors.vat_number = 'Le numéro de TVA intracommunautaire est requis';
    }
  } else {
    // Personne physique
    if (!data.firstname?.trim()) {
      errors.firstname = 'Le prénom est obligatoire';
    }
    if (!data.lastname?.trim()) {
      errors.lastname = 'Le nom est obligatoire';
    }

    if (data.siret) {
      errors.siret = 'Un particulier ne peut pas avoir de SIRET';
    }
  }

  // ---------------------
  // Validation contact
  // ---------------------
  const contactErrors = validateContact(data, { emailField: 'email', emailRequired: false });

  // ---------------------
  // Validation adresse
  // ---------------------
  if (data.country_code === 'FR' && !isValidPostalCode(data.postal_code)) {
    errors.postal_code = 'Le code postal doit contenir 5 chiffres';
  }

  return {
    ...errors,
    ...contactErrors
  };
}
