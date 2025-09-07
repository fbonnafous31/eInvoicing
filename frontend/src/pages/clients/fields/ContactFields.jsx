import React from 'react';
import { InputField, InputEmail } from '@/components/form';

export default function ContactFields({ formData, errors, touched, handleChange, handleBlur, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <InputEmail
        id="email"
        name="email"
        label="Email"
        value={formData.email}
        onChange={handleFieldChange('email')}
        onBlur={() => handleBlur('email')}
        touched={touched.email}
        disabled={disabled}
        required={false}
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
