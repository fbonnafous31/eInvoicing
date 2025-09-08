import React from 'react';
import { InputField, InputEmail, InputPhone } from '@/components/form';

export default function ContactFields({ formData, touched, handleChange, handleBlur, disabled }) {
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

      <InputPhone
        id="phone"
        name="phone"
        label="Téléphone"
        value={formData.phone}
        onChange={handleFieldChange('phone')}
        onBlur={() => handleBlur('phone')}
        touched={touched.phone}
        disabled={disabled}
        required={false} 
      />
    </>
  );
}
