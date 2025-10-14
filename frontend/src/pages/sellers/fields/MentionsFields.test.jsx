// src/pages/sellers/fields/MentionsFields.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import MentionsFields from './MentionsFields';

// 🔹 Mock du composant form
vi.mock('@/components/form', () => ({
  TextAreaField: ({ id, value, onChange, onBlur, disabled }) => (
    <textarea
      data-testid={id}
      value={value}
      onChange={e => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
    />
  ),
}));

describe('MentionsFields', () => {
  let formData, touched, errors, handleChange, handleBlur;

  beforeEach(() => {
    formData = { additional_1: 'Texte 1', additional_2: 'Texte 2' };
    touched = {};
    errors = {};
    handleChange = vi.fn();
    handleBlur = vi.fn();
  });

  it('rend les champs avec les valeurs initiales', () => {
    render(
      <MentionsFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    expect(screen.getByTestId('additional_1')).toHaveValue(formData.additional_1);
    expect(screen.getByTestId('additional_2')).toHaveValue(formData.additional_2);
  });

  it('appelle handleChange quand on modifie un champ', () => {
    render(
      <MentionsFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.change(screen.getByTestId('additional_1'), { target: { value: 'Nouveau 1' } });
    expect(handleChange).toHaveBeenCalledWith('additional_1', 'Nouveau 1');

    fireEvent.change(screen.getByTestId('additional_2'), { target: { value: 'Nouveau 2' } });
    expect(handleChange).toHaveBeenCalledWith('additional_2', 'Nouveau 2');
  });

  it('appelle handleBlur quand un champ perd le focus', () => {
    render(
      <MentionsFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={false}
      />
    );

    fireEvent.blur(screen.getByTestId('additional_1'));
    fireEvent.blur(screen.getByTestId('additional_2'));
    expect(handleBlur).toHaveBeenCalledTimes(2);
  });

  it('désactive les champs si disabled=true', () => {
    render(
      <MentionsFields
        formData={formData}
        touched={touched}
        errors={errors}
        handleChange={handleChange}
        handleBlur={handleBlur}
        disabled={true}
      />
    );

    expect(screen.getByTestId('additional_1')).toBeDisabled();
    expect(screen.getByTestId('additional_2')).toBeDisabled();
  });
});
