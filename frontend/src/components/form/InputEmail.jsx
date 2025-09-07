import React, { useState, useEffect } from "react";
import { validateEmail, validateOptionalEmail } from "@/utils/validators/email";

export default function InputEmail({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  touched,
  required = false,
  disabled = false,
  hideLabel = false,
  ...props
}) {
  const [error, setError] = useState("");

  // Validation à chaque changement
  useEffect(() => {
    if (touched) {
      const validationError = required ? validateEmail(value) : validateOptionalEmail(value);
      setError(validationError);
    }
  }, [value, touched, required]);

  const handleChange = (val) => {
    onChange?.(val);
    if (touched) {
      const validationError = required ? validateEmail(val) : validateOptionalEmail(val);
      setError(validationError);
    }
  };

  const hasError = Boolean(error);

  return (
    <div className="mb-3">
      {!hideLabel && (
        <label htmlFor={id || name} className="form-label">
          {label} {required && "*"}
        </label>
      )}
      <input
        type="email"
        id={id || name}
        name={name}
        className={`form-control ${hasError ? "is-invalid" : ""}`}
        value={value ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => onBlur?.(name)}
        disabled={disabled}
        {...props}
      />
      {hasError && <small className="text-danger">{error}</small>}
    </div>
  );
}
