import React from 'react';
import { TextAreaField } from '@/components/form';

export default function MentionsFields({ formData, errors, handleChange, handleBlur, touched, disabled }) {
  const handleFieldChange = (field) => (val) => handleChange(field, val);

  return (
    <>
      {/* 🔹 Mention complémentaire 1 */}
      <TextAreaField
        id="additional_1"
        name="additional_1"
        label="Mention complémentaire 1"
        value={formData.additional_1}
        onChange={handleFieldChange('additional_1')}
        onBlur={handleBlur}
        touched={touched.additional_1}
        disabled={disabled}
        error={errors.additional_1}
        rows={3}
      />

      {/* 🔹 Mention complémentaire 2 */}
      <TextAreaField
        id="additional_2"
        name="additional_2"
        label="Mention complémentaire 2"
        value={formData.additional_2}
        onChange={handleFieldChange('additional_2')}
        onBlur={handleBlur}
        touched={touched.additional_2}
        disabled={disabled}
        error={errors.additional_2}
        rows={3}
      />
    </>
  );
}
