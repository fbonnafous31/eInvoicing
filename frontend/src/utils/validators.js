import { isValidSiret } from './siret';

export function validatePerson(data) {
  const errors = {};

  // Pour les vendeurs, on considère toujours qu'il s'agit d'une société
  const isCompany = data.is_company !== undefined ? data.is_company : true;

  if (isCompany) {
    // Nom légal obligatoire
    if (!data.legal_name?.trim()) {
      errors.legal_name = 'Le nom légal est obligatoire';
    }

    // SIRET / identifiant légal si pays FR
    if (data.country_code === 'FR' && data.legal_identifier && !isValidSiret(data.legal_identifier)) {
      errors.legal_identifier = 'SIRET invalide';
    }
  } else {
    // Pour les particuliers (si jamais tu en as un jour)
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

  // Validations communes
  if (data.email && !/\S+@\S+\.\S+/.test(data.email)) {
    errors.email = 'Email invalide';
  }

  if (data.phone && !/^\+?[0-9\s-]{6,20}$/.test(data.phone)) {
    errors.phone = 'Numéro de téléphone invalide';
  }

  return errors;
}
