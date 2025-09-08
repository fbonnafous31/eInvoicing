// components/form/InputSiret.jsx
import React from "react";
import InputField from "./InputField";
import { isValidSiret } from "@/utils/validators/siret";

export default function InputSiret({
  value,
  touched = false,
  required = false,
  error = "",
  onChange,
  onBlur,
  ...props
}) {
  // L’erreur est entièrement gérée par le parent, plus besoin de state/useEffect
  const displayError =
    error ||
    (required && touched && !value
      ? "Le SIRET est obligatoire"
      : value && !isValidSiret(value)
      ? "SIRET invalide"
      : "");

  return (
    <InputField
      type="text"
      value={value}
      error={displayError}
      required={required}
      touched={touched}
      onChange={onChange}
      onBlur={onBlur}
      inputMode="numeric"   // clavier numérique sur mobile
      pattern="\d{14}"      // 14 chiffres
      maxLength={14}
      {...props}
    />
  );
}
