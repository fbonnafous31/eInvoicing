import React from 'react';
import { InputField, SelectField, TextAreaField } from '@/components/form';
import { paymentTermsOptions } from "../../../constants/paymentTerms";
import { paymentMethodsOptions } from "../../../constants/paymentMethods";

export default function FinanceFields({ formData, errors, handleChange, handleBlur, touched, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      {/* 🔹 TVA intracommunautaire */}
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

      {/* 🔹 Registre du commerce */}
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

      {/* 🔹 Capital social */}
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

      {/* 🔹 Moyen de paiement */}
      <SelectField
        id="payment_method"
        name="payment_method"
        label="Moyen de paiement"
        value={formData.payment_method || 'bank_transfer'}
        onChange={handleFieldChange('payment_method')}
        onBlur={handleBlur}
        touched={touched.payment_method}
        disabled={disabled}
        error={errors.payment_method}
        options={paymentMethodsOptions}
      />


      <SelectField
        id="payment_terms"
        name="payment_terms"
        label="Conditions de paiement"
        value={formData.payment_terms || "30_df"} 
        onChange={handleFieldChange('payment_terms')}
        onBlur={handleBlur}
        touched={touched.payment_terms}
        disabled={disabled}
        error={errors.payment_terms}
        options={paymentTermsOptions}
      />

      {/* 🔹 IBAN */}
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

      {/* 🔹 BIC */}
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
