import React from 'react';
import InputField from '../../../components/form/InputField';

export default function ContactFields({ formData, errors, touched, handleChange, handleBlur, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <InputField
        id="email"
        name="email"
        label="Email *"
        type="email"
        value={formData.email}
        onChange={handleFieldChange('email')}
        onBlur={() => handleBlur('email')}
        touched={touched.email}
        disabled={disabled}
        error={errors.email}
      />

      <InputField
        id="phone"
        name="phone"
        label="Téléphone"
        value={formData.phone}
        onChange={handleFieldChange('phone')}
        onBlur={() => handleBlur('phone')}
        touched={touched.phone}
        disabled={disabled}
        error={errors.phone}
      />
    </>
  );
}
