import React from "react";

export default function InputField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  touched,   
  required = false,
  error,
  submitted = false,
  hideLabel = false,
  ...props
}) {
  const hasError =
    (required && touched && !value) ||  
    (required && submitted && !value) ||
    Boolean(error);

  return (
    <div className="mb-3">
      {!hideLabel && (
        <label htmlFor={id || name} className="form-label">
          {label} {required && "*"}
        </label>
      )}
      <input
        type={type}
        id={id || name}
        name={name}
        className={`form-control ${hasError ? "is-invalid" : ""}`}
        value={value ?? ""}
        onChange={(e) => onChange?.(e.target.value)}  
        onBlur={() => onBlur?.(name)}   
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
