import { isValidSiret } from './siret';

export function validateSeller(data) {
  const errors = {};

  const requiredFields = ['legal_name', 'legal_identifier', 'address', 'city', 'postal_code', 'registration_info', 'contact_email', 'company_type'];

  requiredFields.forEach(field => {
    if (!data[field] || data[field].trim() === '') {
      errors[field] = 'Ce champ est obligatoire';
    }
  });

  if (data.country_code === 'FR' && !isValidSiret(data.legal_identifier)) {
    errors.legal_identifier = 'SIRET invalide';
  }

  if (data.contact_email && !/\S+@\S+\.\S+/.test(data.contact_email)) {
    errors.contact_email = 'Email invalide';
  }

  return errors;
}
