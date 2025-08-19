import React from 'react';
import InputField from '../../../components/form/InputField';
import TextAreaField from '../../../components/form/TextAreaField';

export default function FinanceFields({ formData, errors, handleChange, disabled }) {
  return (
    <>
      <InputField
        id="vat_number"
        name="vat_number"
        label="Numéro de TVA"
        value={formData.vat_number}
        onChange={handleChange}
        disabled={disabled}
        error={errors.vat_number}
      />
      <TextAreaField
        id="registration_info"
        name="registration_info"
        label="Informations d’enregistrement *"
        value={formData.registration_info}
        onChange={handleChange}
        disabled={disabled}
        error={errors.registration_info}
      />
      <InputField
        id="share_capital"
        name="share_capital"
        label="Capital social"
        type="number"
        step="0.01"
        value={formData.share_capital}
        onChange={handleChange}
        disabled={disabled}
        error={errors.share_capital}
      />
      <TextAreaField
        id="bank_details"
        name="bank_details"
        label="Détails bancaires"
        value={formData.bank_details}
        onChange={handleChange}
        disabled={disabled}
        error={errors.bank_details}
      />
    </>
  );
}
