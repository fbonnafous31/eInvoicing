import React from "react";

export default function SelectField({
  label,
  name,
  value,
  onChange,
  onBlur,
  touched,      // ✅ vient du hook
  options = [],
  required = false,
  error,
  submitted = false,
  ...props
}) {
  const hasError =
    (required && touched && !value) ||
    (required && submitted && !value) ||
    Boolean(error);

  return (
    <div className="mb-3">
      <label className="form-label">
        {label} {required && "*"}
      </label>
      <select
        name={name}
        className={`form-control ${hasError ? "is-invalid" : ""}`}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}  
        onBlur={() => onBlur?.(name)}   // appelle handleBlur(field) du hook
        {...props}
      >
        <option value="">-- Sélectionner --</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {hasError && (
        <small className="text-danger">
          {error || "Ce champ est obligatoire"}
        </small>
      )}
    </div>
  );
}
