import React from 'react';
import { InputField, SelectField } from '@/components/form';
import companyTypes from '../../../constants/companyTypes';

export default function LegalFields({ formData, errors, handleChange, handleBlur, touched, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <InputField
        id="legal_name"
        name="legal_name"
        label="Nom légal *"
        value={formData.legal_name}
        onChange={handleFieldChange('legal_name')}
        onBlur={handleBlur}
        touched={touched.legal_name}
        disabled={disabled}
        error={errors.legal_name}
      />

      <InputField
        id="legal_identifier"
        name="legal_identifier"
        label="Identifiant légal *"
        value={formData.legal_identifier}
        onChange={handleFieldChange('legal_identifier')}
        onBlur={handleBlur}
        touched={touched.legal_identifier}
        disabled={disabled}
        error={errors.legal_identifier}
      />

      <SelectField
        label="Type de société *"
        name="company_type"
        value={formData.company_type}
        onChange={handleFieldChange('company_type')}
        onBlur={handleBlur}
        touched={touched.company_type}
        options={companyTypes}
        disabled={disabled}
        error={errors.company_type}
      />
    </>
  );
}
