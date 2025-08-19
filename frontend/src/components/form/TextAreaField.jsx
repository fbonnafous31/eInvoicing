import React from 'react';

export default function TextAreaField({ id, name, label, value, onChange, disabled, error, rows = 2 }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <textarea
        id={id}
        name={name}
        className="form-control"
        rows={rows}
        value={value}
        onChange={onChange}
        disabled={disabled}
      />
      {error && <small className="text-danger">{error}</small>}
    </div>
  );
}
