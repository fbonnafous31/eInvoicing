import React from 'react';

export default function LegalFields({ formData, errors, handleChange, disabled }) {
  return (
    <>
      {/* Type de client */}
      <div className="mb-3">
        <label className="form-label me-3">Type de client :</label>
        <div className="form-check form-check-inline">
          <input
            type="radio"
            id="is_company_true"
            name="is_company"
            value={true}
            checked={formData.is_company === true}
            onChange={() => handleChange({ target: { name: 'is_company', value: true, type: 'checkbox' } })}
            disabled={disabled}
            className="form-check-input"
          />
          <label htmlFor="is_company_true" className="form-check-label">Entreprise</label>
        </div>
        <div className="form-check form-check-inline">
          <input
            type="radio"
            id="is_company_false"
            name="is_company"
            value={false}
            checked={formData.is_company === false}
            onChange={() => handleChange({ target: { name: 'is_company', value: false, type: 'checkbox' } })}
            disabled={disabled}
            className="form-check-input"
          />
          <label htmlFor="is_company_false" className="form-check-label">Particulier</label>
        </div>
      </div>

      {formData.is_company ? (
        <>
          {/* Nom légal */}
          <div className="mb-3">
            <label htmlFor="legal_name" className="form-label">Nom légal *</label>
            <input
              type="text"
              id="legal_name"
              name="legal_name"
              className={`form-control ${errors.legal_name ? 'is-invalid' : ''}`}
              disabled={disabled}
              value={formData.legal_name ?? ''}
              onChange={handleChange}
            />
            {errors.legal_name && <div className="invalid-feedback">{errors.legal_name}</div>}
          </div>

          {/* SIRET */}
          <div className="mb-3">
            <label htmlFor="siret" className="form-label">SIRET</label>
            <input
              type="text"
              id="siret"
              name="siret"
              className={`form-control ${errors.siret ? 'is-invalid' : ''}`}
              disabled={disabled}
              value={formData.siret ?? ''}
              onChange={handleChange}
            />
            {errors.siret && <div className="invalid-feedback">{errors.siret}</div>}
          </div>

          {/* Identifiant légal */}
          <div className="mb-3">
            <label htmlFor="legal_identifier" className="form-label">Identifiant légal (optionnel)</label>
            <input
              type="text"
              id="legal_identifier"
              name="legal_identifier"
              className="form-control"
              disabled={disabled}
              value={formData.legal_identifier ?? ''}
              onChange={handleChange}
            />
          </div>
        </>
      ) : (
        <>
          {/* Prénom / Nom */}
          <div className="mb-3">
            <label htmlFor="firstname" className="form-label">Prénom *</label>
            <input
              type="text"
              id="firstname"
              name="firstname"
              className={`form-control ${errors.firstname ? 'is-invalid' : ''}`}
              disabled={disabled}
              value={formData.firstname ?? ''}
              onChange={handleChange}
            />
            {errors.firstname && <div className="invalid-feedback">{errors.firstname}</div>}
          </div>

          <div className="mb-3">
            <label htmlFor="lastname" className="form-label">Nom *</label>
            <input
              type="text"
              id="lastname"
              name="lastname"
              className={`form-control ${errors.lastname ? 'is-invalid' : ''}`}
              disabled={disabled}
              value={formData.lastname ?? ''}
              onChange={handleChange}
            />
            {errors.lastname && <div className="invalid-feedback">{errors.lastname}</div>}
          </div>
        </>
      )}
    </>
  );
}
