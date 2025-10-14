// src/pages/sellers/fields/LegalFields.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import LegalFields from './LegalFields';

// 🔹 Mock des composants form
vi.mock('@/components/form', () => ({
  InputField: ({ id, value, onChange, onBlur, disabled }) => (
    <input
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    />
  ),
  SelectField: ({ id, value, onChange, onBlur, options, disabled }) => (
    <select
      data-testid={id || 'selectField'}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label || o.value}
        </option>
      ))}
    </select>
  ),
}));

describe('LegalFields', () => {
  let formData, touched, errors, handleChange, handleBlur;

  beforeEach(() => {
    formData = {
      legal_name: 'Ma société',
      legal_identifier: '123456789',
      company_type: 'SARL',
    };
    touched = {};
    errors = {};
    handleChange = vi.fn();
    handleBlur = vi.fn();
  });

  it('rend tous les champs avec les valeurs initiales', () => {
    render(
      <LegalFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByTestId('legal_name')).toHaveValue(formData.legal_name);
    expect(screen.getByTestId('legal_identifier')).toHaveValue(formData.legal_identifier);
    expect(screen.getByTestId('selectField')).toHaveValue(formData.company_type);
  });

  it('appelle handleChange quand on modifie un champ', () => {
    render(
      <LegalFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.change(screen.getByTestId('legal_name'), { target: { value: 'Nouvelle société' } });
    expect(handleChange).toHaveBeenCalledWith('legal_name', 'Nouvelle société');

    fireEvent.change(screen.getByTestId('selectField'), { target: { value: 'SA' } });
    expect(handleChange).toHaveBeenCalledWith('company_type', 'SA');
  });

  it('appelle handleBlur quand un champ perd le focus', () => {
    render(
      <LegalFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.blur(screen.getByTestId('legal_name'));
    expect(handleBlur).toHaveBeenCalled();
  });

  it('désactive tous les champs si disabled=true', () => {
    render(
      <LegalFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    expect(screen.getByTestId('legal_name')).toBeDisabled();
    expect(screen.getByTestId('legal_identifier')).toBeDisabled();
    expect(screen.getByTestId('selectField')).toBeDisabled();
  });
});
