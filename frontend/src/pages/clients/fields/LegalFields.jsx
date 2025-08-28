import React from 'react';
import { InputField } from '@/components/form';

export default function LegalFields({ formData, errors, touched, handleChange, handleBlur, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

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
            value="true"
            checked={formData.is_company === true}
            onChange={e => handleChange('is_company', e.target.value === 'true')}
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
            value="false"
            checked={formData.is_company === false}
            onChange={e => handleChange('is_company', e.target.value === 'true')}
            disabled={disabled}
            className="form-check-input"
          />
          <label htmlFor="is_company_false" className="form-check-label">Particulier</label>
        </div>
      </div>

      {formData.is_company ? (
        <>
          {/* Nom légal */}
          <InputField
            id="legal_name"
            name="legal_name"
            label="Nom légal *"
            value={formData.legal_name}
            onChange={handleFieldChange('legal_name')}
            onBlur={() => handleBlur('legal_name')}
            touched={touched.legal_name}
            disabled={disabled}
            error={errors.legal_name}
          />

          {/* SIRET uniquement si FR */}
          {formData.country_code === 'FR' && (
            <InputField
              id="siret"
              name="siret"
              label="SIRET *"
              value={formData.siret}
              onChange={handleFieldChange('siret')}
              onBlur={() => handleBlur('siret')}
              touched={touched.siret}
              disabled={disabled}
              error={errors.siret}
            />
          )}
        </>
      ) : (
        <>
          {/* Particulier */}
          <InputField
            id="firstname"
            name="firstname"
            label="Prénom *"
            value={formData.firstname}
            onChange={handleFieldChange('firstname')}
            onBlur={() => handleBlur('firstname')}
            touched={touched.firstname}
            disabled={disabled}
            error={errors.firstname}
          />

          <InputField
            id="lastname"
            name="lastname"
            label="Nom *"
            value={formData.lastname}
            onChange={handleFieldChange('lastname')}
            onBlur={() => handleBlur('lastname')}
            touched={touched.lastname}
            disabled={disabled}
            error={errors.lastname}
          />
        </>
      )}
    </>
  );
}
