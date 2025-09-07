// components/form/InputPostalCode.jsx
import React from "react";
import InputField from "./InputField";
import { isValidPostalCode } from "../../utils/validators/postal_code";

export default function InputPostalCode({
  id,
  name = "postal_code",
  label = "Code postal",
  value,
  onChange,
  onBlur,
  touched,
  required = false,
  submitted = false,
  ...props
}) {
  // Validation spécifique
  const error =
    (required && (touched || submitted) && !value)
      ? "Le code postal est obligatoire"
      : value && !isValidPostalCode(value)
        ? "Code postal invalide"
        : null;

  return (
    <InputField
      id={id || name}
      name={name}
      label={label}
      type="text"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      touched={touched}
      required={required}
      submitted={submitted}
      error={error}
      inputMode="numeric"     // mobile : clavier numérique
      pattern="[0-9]*"        // restriction chiffres
      maxLength={5}           // 5 chiffres max
      {...props}
    />
  );
}
