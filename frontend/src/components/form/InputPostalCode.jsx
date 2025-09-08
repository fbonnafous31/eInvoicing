import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import { isValidPostalCode } from "@/utils/validators/postal_code";

export default function InputPostalCode({
  value,
  touched,
  required = false,
  submitted = false,
  ...props
}) {
  const [error, setError] = useState("");

  useEffect(() => {
    if ((touched || submitted)) {
      if (required && !value) {
        setError("Le code postal est obligatoire");
      } else if (value && !isValidPostalCode(value)) {
        setError("Code postal invalide");
      } else {
        setError("");
      }
    }
  }, [value, touched, submitted, required]);

  return (
    <InputField
      type="text"
      value={value}
      error={error}
      required={required}
      touched={touched}
      submitted={submitted}
      inputMode="numeric"   // clavier numérique sur mobile
      pattern="[0-9]*"      // restriction chiffres
      maxLength={5}         // 5 chiffres max
      {...props}
    />
  );
}
