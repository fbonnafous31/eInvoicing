// frontend/src/pages/sellers/fields/ContactFields.jsx
import React from 'react';
import { InputEmail, InputPhone } from '@/components/form';

export default function ContactFields({ formData, touched, handleChange, handleBlur, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <InputEmail
        id="contact_email"
        name="contact_email"
        label="Email"
        value={formData.contact_email}
        onChange={handleFieldChange('contact_email')}
        onBlur={() => handleBlur('contact_email')}
        touched={touched.contact_email}
        disabled={disabled}
        required={false}
      />

      <InputPhone
        id="phone_number"
        name="phone_number"
        label="Téléphone"
        value={formData.phone_number}
        onChange={handleFieldChange('phone_number')}
        onBlur={() => handleBlur('phone_number')}
        touched={touched.phone_number}
        disabled={disabled}
        required={false}
      />
    </>
  );
}
