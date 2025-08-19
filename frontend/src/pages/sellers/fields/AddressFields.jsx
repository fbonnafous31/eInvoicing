import React from 'react';
import InputField from '../../../components/form/InputField';
import TextAreaField from '../../../components/form/TextAreaField';

export default function AddressFields({ formData, errors, handleChange, disabled, countryCodes }) {
  return (
    <>
      <TextAreaField
        id="address"
        name="address"
        label="Adresse *"
        value={formData.address}
        onChange={handleChange}
        disabled={disabled}
        error={errors.address}
      />
      <InputField
        id="city"
        name="city"
        label="Ville *"
        value={formData.city}
        onChange={handleChange}
        disabled={disabled}
        error={errors.city}
      />
      <InputField
        id="postal_code"
        name="postal_code"
        label="Code postal *"
        value={formData.postal_code}
        onChange={handleChange}
        disabled={disabled}
        error={errors.postal_code}
      />
      <select
        className="form-select mb-3"
        name="country_code"
        value={formData.country_code}
        disabled={disabled}
        onChange={handleChange}
      >
        {countryCodes.map(c => (
          <option key={c.code} value={c.code}>
            {c.code} - {c.name}
          </option>
        ))}
      </select>
    </>
  );
}
