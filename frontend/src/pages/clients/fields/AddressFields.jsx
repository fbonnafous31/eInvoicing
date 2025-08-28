import React from 'react';
import { InputField, SelectField, TextAreaField } from '@/components/form';

export default function AddressFields({ formData, errors, touched, handleChange, handleBlur, disabled, countryCodes }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <TextAreaField
        id="address"
        name="address"
        label="Adresse *"
        value={formData.address}
        onChange={handleFieldChange('address')}
        onBlur={() => handleBlur('address')}
        touched={touched.address}
        disabled={disabled}
        error={errors.address}
      />

      <InputField
        id="city"
        name="city"
        label="Ville *"
        value={formData.city}
        onChange={handleFieldChange('city')}
        onBlur={() => handleBlur('city')}
        touched={touched.city}
        disabled={disabled}
        error={errors.city}
      />

      <InputField
        id="postal_code"
        name="postal_code"
        label="Code postal *"
        value={formData.postal_code}
        onChange={handleFieldChange('postal_code')}
        onBlur={() => handleBlur('postal_code')}
        touched={touched.postal_code}
        disabled={disabled}
        error={errors.postal_code}
      />

      <SelectField
        id="country_code"
        name="country_code"
        label="Pays *"
        value={formData.country_code}
        onChange={handleFieldChange('country_code')}
        onBlur={() => handleBlur('country_code')}
        touched={touched.country_code}
        options={countryCodes.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
        disabled={disabled}
        error={errors.country_code}
      />
    </>
  );
}
