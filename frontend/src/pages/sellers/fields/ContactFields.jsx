import React from 'react';
import InputField from '../../../components/form/InputField';

export default function ContactFields({ formData, errors, handleChange, handleBlur, touched, disabled }) {
  // helper pour ne pas répéter la syntaxe handleChange('field', val)
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <InputField
        id="contact_email"
        name="contact_email"
        label="Email *"
        type="email"
        value={formData.contact_email}
        onChange={handleFieldChange('contact_email')}
        onBlur={handleBlur}
        touched={touched.contact_email}
        disabled={disabled}
        error={errors.contact_email}
      />

      <InputField
        id="phone_number"
        name="phone_number"
        label="Téléphone"
        value={formData.phone_number}
        onChange={handleFieldChange('phone_number')}
        onBlur={handleBlur}
        touched={touched.phone_number}
        disabled={disabled}
        error={errors.phone_number}
      />
    </>
  );
}
