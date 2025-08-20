import React from 'react';

export default function AddressFields({ formData, errors, handleChange, disabled, countryCodes }) {
  return (
    <>
      <div className="mb-3">
        <label htmlFor="address" className="form-label">Adresse</label>
        <textarea
          id="address"
          name="address"
          className={`form-control ${errors.address ? 'is-invalid' : ''}`}
          rows="2"
          disabled={disabled}
          value={formData.address ?? ''}
          onChange={handleChange}
        />
        {errors.address && <div className="invalid-feedback">{errors.address}</div>}
      </div>

      <div className="row mb-3">
        <div className="col-md-4">
          <label htmlFor="city" className="form-label">Ville</label>
          <input
            type="text"
            id="city"
            name="city"
            className={`form-control ${errors.city ? 'is-invalid' : ''}`}
            disabled={disabled}
            value={formData.city ?? ''}
            onChange={handleChange}
          />
          {errors.city && <div className="invalid-feedback">{errors.city}</div>}
        </div>

        <div className="col-md-4">
          <label htmlFor="postal_code" className="form-label">Code postal</label>
          <input
            type="text"
            id="postal_code"
            name="postal_code"
            className={`form-control ${errors.postal_code ? 'is-invalid' : ''}`}
            disabled={disabled}
            value={formData.postal_code ?? ''}
            onChange={handleChange}
          />
          {errors.postal_code && <div className="invalid-feedback">{errors.postal_code}</div>}
        </div>

        <div className="col-md-4">
          <label htmlFor="country_code" className="form-label">Pays</label>
          <select
            id="country_code"
            name="country_code"
            className={`form-select ${errors.country_code ? 'is-invalid' : ''}`}
            disabled={disabled}
            value={formData.country_code ?? ''}
            onChange={handleChange}
          >
            {countryCodes.map(({ code, name }) => (
              <option key={code} value={code}>{code} - {name}</option>
            ))}
          </select>
          {errors.country_code && <div className="invalid-feedback">{errors.country_code}</div>}
        </div>
      </div>
    </>
  );
}
