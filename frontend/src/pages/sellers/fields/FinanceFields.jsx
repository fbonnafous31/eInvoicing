import React from 'react';
import { InputField, TextAreaField } from '@/components/form';

export default function FinanceFields({ formData, errors, handleChange, handleBlur, touched, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      <InputField
        id="vat_number"
        name="vat_number"
        label="Numéro de TVA"
        value={formData.vat_number}
        onChange={handleFieldChange('vat_number')}
        onBlur={handleBlur}
        touched={touched.vat_number}
        disabled={disabled}
        error={errors.vat_number}
      />

      <TextAreaField
        id="registration_info"
        name="registration_info"
        label="Registre du commerce"
        value={formData.registration_info}
        onChange={handleFieldChange('registration_info')}
        onBlur={handleBlur}
        touched={touched.registration_info}
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
        onChange={handleFieldChange('share_capital')}
        onBlur={handleBlur}
        touched={touched.share_capital}
        disabled={disabled}
        error={errors.share_capital}
      />

      <InputField
        id="iban"
        name="iban"
        label="IBAN"
        value={formData.iban}
        onChange={handleFieldChange('iban')}
        onBlur={handleBlur}
        touched={touched.iban}
        disabled={disabled}
        error={errors.iban}
      />

      <InputField
        id="bic"
        name="bic"
        label="BIC"
        value={formData.bic}
        onChange={handleFieldChange('bic')}
        onBlur={handleBlur}
        touched={touched.bic}
        disabled={disabled}
        error={errors.bic}
      />
    </>
  );
}
