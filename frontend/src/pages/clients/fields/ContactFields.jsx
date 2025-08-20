import React from 'react';

export default function ContactFields({ formData, errors, handleChange, disabled }) {
  return (
    <>
      {/* Email */}
      <div className="mb-3">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className={`form-control ${errors.email ? 'is-invalid' : ''}`}
          disabled={disabled}
          value={formData.email ?? ''}
          onChange={handleChange}
        />
        {errors.email && <div className="invalid-feedback">{errors.email}</div>}
      </div>

      {/* Téléphone */}
      <div className="mb-3">
        <label htmlFor="phone" className="form-label">Téléphone</label>
        <input
          type="text"
          id="phone"
          name="phone"
          className={`form-control ${errors.phone ? 'is-invalid' : ''}`}
          maxLength={30}
          disabled={disabled}
          value={formData.phone ?? ''}
          onChange={handleChange}
        />
        {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
      </div>
    </>
  );
}
