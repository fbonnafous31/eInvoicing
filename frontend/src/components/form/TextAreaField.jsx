import React from "react";

export default function TextAreaField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  touched,       // ✅ vient du hook
  required = false,
  error,
  submitted = false,
  rows = 2,
  ...props
}) {
  const hasError =
    (required && touched && !value) ||
    (required && submitted && !value) ||
    Boolean(error);

  return (
    <div className="mb-3">
      <label htmlFor={id || name} className="form-label">
        {label} {required && "*"}
      </label>
      <textarea
        id={id || name}
        name={name}
        className={`form-control ${hasError ? "is-invalid" : ""}`}
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}  
        onBlur={() => onBlur?.(name)}   // appelle handleBlur(field) du hook
        {...props}
      />
      {hasError && (
        <small className="text-danger">
          {error || "Ce champ est obligatoire"}
        </small>
      )}
    </div>
  );
}
