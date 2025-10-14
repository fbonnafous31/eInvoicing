// src/pages/sellers/fields/FinanceFields.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import FinanceFields from './FinanceFields';

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
  TextAreaField: ({ id, value, onChange, onBlur, disabled }) => (
    <textarea
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    />
  ),
  SelectField: ({ id, value, onChange, onBlur, disabled, options }) => (
    <select
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  ),
}));

describe('FinanceFields', () => {
  let formData, touched, errors, handleChange, handleBlur;

  beforeEach(() => {
    formData = {
      vat_number: 'FR123456789',
      registration_info: 'RCS Paris 123456',
      share_capital: '10000',
      payment_method: 'bank_transfer',
      payment_terms: '30_df',
      iban: 'FR7630006000011234567890189',
      bic: 'BNPAFRPP',
    };
    touched = {};
    errors = {};
    handleChange = vi.fn();
    handleBlur = vi.fn();
  });

  it('rend tous les champs avec les valeurs initiales', () => {
    render(
      <FinanceFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    Object.entries(formData).forEach(([key, val]) => {
      expect(screen.getByTestId(key)).toHaveValue(val);
    });
  });

  it('appelle handleChange quand on modifie un champ', () => {
    render(
      <FinanceFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.change(screen.getByTestId('vat_number'), { target: { value: 'FR987654321' } });
    expect(handleChange).toHaveBeenCalledWith('vat_number', 'FR987654321');
  });

  it('appelle handleBlur quand un champ perd le focus', () => {
    render(
      <FinanceFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.blur(screen.getByTestId('vat_number'));
    expect(handleBlur).toHaveBeenCalled();
  });

  it('désactive tous les champs si disabled=true', () => {
    render(
      <FinanceFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    Object.keys(formData).forEach(key => {
      expect(screen.getByTestId(key)).toBeDisabled();
    });
  });
});
