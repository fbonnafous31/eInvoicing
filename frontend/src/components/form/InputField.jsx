import React from "react";

export default function InputField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  touched,   // ✅ vient du hook
  required = false,
  error,
  submitted = false,
  ...props
}) {
  const hasError =
    (required && touched && !value) ||  // utilise le touched du hook
    (required && submitted && !value) ||
    Boolean(error);

  return (
    <div className="mb-3">
      <label htmlFor={id || name} className="form-label">
        {label} {required && "*"}
      </label>
      <input
        type={type}
        id={id || name}
        name={name}
        className={`form-control ${hasError ? "is-invalid" : ""}`}
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
