import React, { useState, useEffect } from "react";
import InputField from "./InputField";
import { validatePhoneNumber } from "@/utils/validators/phone_number";

export default function InputPhone({ value, touched, required = false, ...props }) {
  const [error, setError] = useState("");

  useEffect(() => {
    if (touched) {
      const validationError = validatePhoneNumber(value);
      setError(validationError);
    }
  }, [value, touched]);

  return (
    <InputField
      type="tel"
      value={value}
      error={error}
      required={required}
      touched={touched}
      {...props}
    />
  );
}
