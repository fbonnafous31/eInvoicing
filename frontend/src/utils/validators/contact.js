// utils/validators/contact.js
import { validateEmail, validateOptionalEmail } from "./email";

export function validateContact(data, options = {}) {
  const errors = {};
  const {
    emailField = "email",
    emailRequired = false,
    phoneField = "phone",
  } = options;

  const emailValue = data[emailField];
  const phoneValue = data[phoneField];

  // Email
  const emailError = emailRequired
    ? validateEmail(emailValue)
    : validateOptionalEmail(emailValue);

  if (emailError) errors[emailField] = emailError;

  // Téléphone
  if (phoneValue && !/^\+?[0-9\s-]{6,20}$/.test(phoneValue)) {
    errors[phoneField] = "Numéro de téléphone invalide";
  }

  return errors;
}

