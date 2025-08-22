import React, { useState } from 'react';

export default function SelectField({
  label,
  value,
  onChange,
  onBlur,
  options = [],
  required = false,
  error,
  submitted = false,
  ...props
}) {
  const [touched, setTouched] = useState(false);

  const handleBlur = () => {
    setTouched(true);
    onBlur?.(value);
  };

  const showError = (required && touched && !value) || (required && submitted && !value) || error;

  return (
    <div className="mb-3">
      <label className="form-label">
        {label}{required && ' *'}
      </label>
      <select
        className="form-control"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={handleBlur}
        {...props}
      >
        <option value="">-- Sélectionner --</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {showError && <small className="text-danger">{typeof showError === 'string' ? showError : 'Ce champ est obligatoire'}</small>}
    </div>
  );
}
