// src/pages/sellers/fields/AddressFields.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import AddressFields from './AddressFields';

// 🔹 Mock des composants form pour qu'ils gèrent disabled, value, onChange, onBlur
vi.mock('@/components/form', () => ({
  InputField: ({ id, value, onChange, onBlur, disabled }) => (
    <input
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled} // ✅ maintenant pris en compte
    />
  ),
  InputPostalCode: ({ id, value, onChange, onBlur, disabled }) => (
    <input
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled} // ✅ maintenant pris en compte
    />
  ),
  TextAreaField: ({ id, value, onChange, onBlur, disabled }) => (
    <textarea
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled} // ✅ maintenant pris en compte
    />
  ),
  SelectField: ({ id = 'select', value, onChange, onBlur, options, disabled }) => (
    <select
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled} // ✅ maintenant pris en compte
    >
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),
}));

describe('AddressFields', () => {
  let formData, errors, touched, handleChange, handleBlur, countryCodes;

  beforeEach(() => {
    formData = {
      address: '123 rue du Test',
      postal_code: '75001',
      city: 'Paris',
      country_code: 'FR',
    };
    errors = {
      address: 'Adresse obligatoire',
      city: 'Ville obligatoire',
      country_code: 'Pays obligatoire',
    };
    touched = {
      address: true,
      postal_code: true,
      city: true,
      country_code: true,
    };
    handleChange = vi.fn();
    handleBlur = vi.fn();
    countryCodes = [
      { code: 'FR', name: 'France' },
      { code: 'DE', name: 'Allemagne' },
    ];
  });

  it('rend tous les champs avec les valeurs initiales', () => {
    render(
      <AddressFields
        formData={formData}
        errors={{}}
        touched={{}}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
        countryCodes={countryCodes}
      />
    );

    expect(screen.getByTestId('address')).toHaveValue('123 rue du Test');
    expect(screen.getByTestId('postal_code')).toHaveValue('75001');
    expect(screen.getByTestId('city')).toHaveValue('Paris');
    expect(screen.getByTestId('select')).toHaveValue('FR');
  });

  it('appelle handleChange quand on modifie un champ', () => {
    render(
      <AddressFields
        formData={formData}
        errors={{}}
        touched={{}}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
        countryCodes={countryCodes}
      />
    );

    fireEvent.change(screen.getByTestId('address'), { target: { value: 'Nouvelle adresse' } });
    fireEvent.change(screen.getByTestId('postal_code'), { target: { value: '12345' } });
    fireEvent.change(screen.getByTestId('city'), { target: { value: 'Lyon' } });
    fireEvent.change(screen.getByTestId('select'), { target: { value: 'DE' } });

    expect(handleChange).toHaveBeenCalledWith('address', 'Nouvelle adresse');
    expect(handleChange).toHaveBeenCalledWith('postal_code', '12345');
    expect(handleChange).toHaveBeenCalledWith('city', 'Lyon');
    expect(handleChange).toHaveBeenCalledWith('country_code', 'DE');
  });

  it('appelle handleBlur quand un champ perd le focus', () => {
    render(
      <AddressFields
        formData={formData}
        errors={{}}
        touched={{}}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
        countryCodes={countryCodes}
      />
    );

    fireEvent.blur(screen.getByTestId('address'));
    fireEvent.blur(screen.getByTestId('postal_code'));
    fireEvent.blur(screen.getByTestId('city'));
    fireEvent.blur(screen.getByTestId('select'));

    expect(handleBlur).toHaveBeenCalledTimes(4);
  });

  it('désactive les champs si disabled=true', () => {
    render(
      <AddressFields
        formData={formData}
        errors={{}}
        touched={{}}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
        countryCodes={countryCodes}
      />
    );

    expect(screen.getByTestId('address')).toBeDisabled();
    expect(screen.getByTestId('postal_code')).toBeDisabled();
    expect(screen.getByTestId('city')).toBeDisabled();
    expect(screen.getByTestId('select')).toBeDisabled();
  });
});
