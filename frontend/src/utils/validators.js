import { isValidSiret } from './siret';

export function validatePerson(data) {
  const errors = {};

  const isCompany = data.is_company !== undefined ? data.is_company : true;

  // ---------------------
  // Validation légale
  // ---------------------
  if (isCompany) {
    if (!data.legal_name?.trim()) {
      errors.legal_name = 'Le nom légal est obligatoire';
    }

    // SIRET obligatoire si entreprise FR
    if (data.country_code === 'FR') {
      const siret = (data.siret || '').toString().replace(/\D/g, '');
      if (!siret) {
        errors.siret = 'Le SIRET est requis pour une entreprise française';
      } else if (siret.length !== 14) {
        errors.siret = 'Le SIRET doit contenir 14 chiffres';
      } else if (!isValidSiret(siret)) {
        errors.siret = 'SIRET invalide';
      }
    } else {
      if (!data.vat_number?.trim()) {
        errors.vat_number = 'Le numéro de TVA intracommunautaire est requis pour les entreprises non françaises';
      }
    }
  } else {
    // Particulier
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
  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Email invalide';
  }

  if (data.phone && !/^\+?[0-9\s-]{6,20}$/.test(data.phone)) {
    errors.phone = 'Numéro de téléphone invalide';
  }

  return errors;
}
