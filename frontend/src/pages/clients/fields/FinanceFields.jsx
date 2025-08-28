import React from 'react';
import { InputField } from '@/components/form';

export default function FinanceFields({ formData, errors, touched, handleChange, handleBlur, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <InputField
      id="vat_number"
      name="vat_number"
      label="Numéro de TVA intracommunautaire"
      value={formData.vat_number}
      onChange={handleFieldChange('vat_number')}
      onBlur={() => handleBlur('vat_number')}
      touched={touched.vat_number}
      disabled={disabled}
      error={errors.vat_number}
    />
  );
}
