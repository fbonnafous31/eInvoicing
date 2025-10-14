// src/pages/sellers/fields/ContactFields.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import ContactFields from './ContactFields';

// 🔹 Mock des composants form
vi.mock('@/components/form', () => ({
  InputEmail: ({ id, value, onChange, onBlur, disabled }) => (
    <input
      data-testid={id}
      type="email"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled} // ✅ prendre en compte disabled
    />
  ),
  InputPhone: ({ id, value, onChange, onBlur, disabled }) => (
    <input
      data-testid={id}
      type="tel"
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled} // ✅ prendre en compte disabled
    />
  ),
}));

describe('ContactFields', () => {
  let formData, touched, handleChange, handleBlur;

  beforeEach(() => {
    formData = {
      contact_email: 'test@example.com',
      phone_number: '0601020304',
    };
    touched = {
      contact_email: true,
      phone_number: true,
    };
    handleChange = vi.fn();
    handleBlur = vi.fn();
  });

  it('rend tous les champs avec les valeurs initiales', () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByTestId('contact_email')).toHaveValue('test@example.com');
    expect(screen.getByTestId('phone_number')).toHaveValue('0601020304');
  });

  it('appelle handleChange quand on modifie un champ', () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.change(screen.getByTestId('contact_email'), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByTestId('phone_number'), { target: { value: '0708091011' } });

    expect(handleChange).toHaveBeenCalledWith('contact_email', 'new@example.com');
    expect(handleChange).toHaveBeenCalledWith('phone_number', '0708091011');
  });

  it('appelle handleBlur quand un champ perd le focus', () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.blur(screen.getByTestId('contact_email'));
    fireEvent.blur(screen.getByTestId('phone_number'));

    expect(handleBlur).toHaveBeenCalledWith('contact_email');
    expect(handleBlur).toHaveBeenCalledWith('phone_number');
  });

  it('désactive les champs si disabled=true', () => {
    render(
      <ContactFields
        formData={formData}
        touched={touched}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    expect(screen.getByTestId('contact_email')).toBeDisabled();
    expect(screen.getByTestId('phone_number')).toBeDisabled();
  });
});
