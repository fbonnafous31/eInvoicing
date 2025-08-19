import React from 'react';
import InputField from '../../../components/form/InputField';

export default function ContactFields({ formData, errors, handleChange, disabled }) {
  return (
    <>
      <InputField
        id="contact_email"
        name="contact_email"
        label="Email *"
        type="email"
        value={formData.contact_email}
        onChange={handleChange}
        disabled={disabled}
        error={errors.contact_email}
      />
      <InputField
        id="phone_number"
        name="phone_number"
        label="Téléphone"
        value={formData.phone_number}
        onChange={handleChange}
        disabled={disabled}
        error={errors.phone_number}
      />
    </>
  );
}
