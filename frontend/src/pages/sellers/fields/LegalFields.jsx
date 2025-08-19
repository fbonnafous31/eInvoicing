import React from 'react';
import InputField from '../../../components/form/InputField';
import companyTypes from '../../../constants/companyTypes';

export default function LegalFields({ formData, errors, handleChange, disabled }) {
  return (
    <>
      <InputField
        id="legal_name"
        name="legal_name"
        label="Nom légal *"
        value={formData.legal_name}
        onChange={handleChange}
        disabled={disabled}
        error={errors.legal_name}
      />
      <InputField
        id="legal_identifier"
        name="legal_identifier"
        label="Identifiant légal *"
        value={formData.legal_identifier}
        onChange={handleChange}
        disabled={disabled}
        error={errors.legal_identifier}
      />
      <select
        className="form-select mb-3"
        name="company_type"
        value={formData.company_type}
        disabled={disabled}
        onChange={handleChange}
      >
        {companyTypes.map(c => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </select>
    </>
  );
}
