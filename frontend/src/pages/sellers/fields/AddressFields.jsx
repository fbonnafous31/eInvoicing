import React from 'react';
import { InputField, SelectField, TextAreaField, InputPostalCode } from '@/components/form';

export default function AddressFields({ formData, errors, handleChange, handleBlur, touched, disabled, countryCodes }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <TextAreaField
        id="address"
        name="address"
        label="Adresse *"
        value={formData.address}
        onChange={handleFieldChange('address')}
        onBlur={handleBlur}
        touched={touched.address}
        disabled={disabled}
        error={errors.address}
      />

      <InputPostalCode
        id="postal_code"
        name="postal_code"
        label="Code postal"
        value={formData.postal_code}
        onChange={handleFieldChange('postal_code')}
        onBlur={handleBlur}
        touched={touched.postal_code}
        disabled={disabled}
        required={true} 
      />

      <InputField
        id="city"
        name="city"
        label="Ville *"
        value={formData.city}
        onChange={handleFieldChange('city')}
        onBlur={handleBlur}
        touched={touched.city}
        disabled={disabled}
        error={errors.city}
      />
      
      <SelectField
        label="Pays *"
        name="country_code"
        value={formData.country_code}
        onChange={handleFieldChange('country_code')}
        onBlur={handleBlur}
        touched={touched.country_code}
        options={countryCodes.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
        disabled={disabled}
        error={errors.country_code}
      />
    </>
  );
}
