import React from 'react';

export default function InputField({ id, name, label, type = 'text', value, onChange, disabled, error, ...props }) {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">{label}</label>
      <input
        type={type}
        id={id}
        name={name}
        className="form-control"
        value={value}
        onChange={onChange}
        disabled={disabled}
        {...props}
      />
      {error && <small className="text-danger">{error}</small>}
    </div>
  );
}
