export default function InputField({
  id,
  name,
  label,
  type = "text",
  value,
  onChange,
  onBlur,
  touched = false,
  required = false,
  error = "",
  submitted = false,
  hideLabel = false,
  helpText = "",
  maxLength,
  ...props
}) {
  const hasError = Boolean(error) || (required && (touched || submitted) && !value);

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
        maxLength={maxLength}    
        {...props}
      />

      {maxLength && (
        <small className="text-muted d-block text-end">
          {value?.length || 0}/{maxLength}
        </small>
      )}

      {hasError && (
        <small className="text-danger">
          {error || "Ce champ est obligatoire"}
        </small>
      )}
    </div>
  );
}