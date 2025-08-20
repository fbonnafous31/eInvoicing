import React from 'react';
import InputField from '../../../components/form/InputField';

export default function ContactFields({ formData, errors, handleChange, disabled }) {
  return (
    <>
      <InputField
        id="email"
        name="email"
        label="Email *"
        type="email"
        value={formData.email}
        onChange={handleChange}
        disabled={disabled}
        error={errors.email}
      />
      <InputField
        id="phone"
        name="phone"
        label="Téléphone"
        value={formData.phone}
        onChange={handleChange}
        disabled={disabled}
        error={errors.phone}
      />
    </>
  );
}
