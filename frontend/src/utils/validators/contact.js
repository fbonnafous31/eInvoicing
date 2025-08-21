// utils/validators/contact.js
export function validateContact(data, options = {}) {
  const errors = {};

  const {
    emailField = 'email',   // nom du champ email
    emailRequired = false,
    phoneField = 'phone_number', // nom du champ téléphone
  } = options;

  const emailValue = data[emailField];
  const phoneValue = data[phoneField];

  if (emailRequired && !emailValue?.trim()) {
    errors[emailField] = 'L’email est obligatoire';
  } else if (emailValue && !/\S+@\S+\.\S+/.test(emailValue)) {
    errors[emailField] = 'Email invalide';
  }

  if (phoneValue && !/^\+?[0-9\s-]{6,20}$/.test(phoneValue)) {
    errors[phoneField] = 'Numéro de téléphone invalide';
  }

  return errors;
}
