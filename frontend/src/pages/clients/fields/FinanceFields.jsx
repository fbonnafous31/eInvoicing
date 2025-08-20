import React from 'react';

export default function FinanceFields({ formData, errors, handleChange, disabled }) {
  return (
    <div className="mb-3">
      <label htmlFor="vat_number" className="form-label">Numéro de TVA intracommunautaire</label>
      <input
        type="text"
        id="vat_number"
        name="vat_number"
        className={`form-control ${errors.vat_number ? 'is-invalid' : ''}`}
        disabled={disabled}
        value={formData.vat_number ?? ''}
        onChange={handleChange}
      />
      {errors.vat_number && <div className="invalid-feedback">{errors.vat_number}</div>}
    </div>
  );
}
