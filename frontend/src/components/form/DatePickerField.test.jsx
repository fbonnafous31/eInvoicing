// src/components/DatePickerField.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DatePickerField } from './DatePickerField';

describe('DatePickerField', () => {
  const defaultProps = {
    id: 'date-test',
    label: 'Date de test',
    value: '',
    onChange: vi.fn(),
    onBlur: vi.fn(),
    error: '',
    required: false,
    disabled: false,
  };

  it('affiche le label et le placeholder', () => {
    render(<DatePickerField {...defaultProps} />);
    expect(screen.getByLabelText('Date de test')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('jj/mm/aaaa')).toBeInTheDocument();
  });

  it('affiche * si required', () => {
    render(<DatePickerField {...defaultProps} required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('affiche l\'erreur et ajoute la classe is-invalid', () => {
    render(<DatePickerField {...defaultProps} error="Date invalide" />);
    const input = screen.getByLabelText('Date de test');
    expect(input).toHaveClass('is-invalid');
    expect(screen.getByText('Date invalide')).toBeInTheDocument();
  });

  it('appel onChange avec la bonne valeur au format YYYY-MM-DD', () => {
    const onChangeMock = vi.fn();
    render(<DatePickerField {...defaultProps} onChange={onChangeMock} />);

    const input = screen.getByPlaceholderText('jj/mm/aaaa');

    // Simule la saisie d'une date directement dans l'input
    fireEvent.change(input, { target: { value: '27/10/2023' } });
    fireEvent.blur(input); // déclenche le onBlur du date-picker

    // Comme onChange attend un objet Date, on simule directement le passage d'une Date
    // Ici on appelle la fonction interne handleChange manuellement pour le test
    // ou on peut passer par userEvent mais fireEvent suffit pour un test simple

    // On peut créer un Date identique à la saisie pour le test
    const testDate = new Date(2023, 9, 27); // mois 0-indexé
    onChangeMock(testDate); // simulateur de callback

    // Vérifie le format attendu
    const year = testDate.getFullYear();
    const month = (testDate.getMonth() + 1).toString().padStart(2, '0');
    const day = testDate.getDate().toString().padStart(2, '0');
    const expectedValue = `${year}-${month}-${day}`;

    // OnChange devrait être appelé avec la date formatée
    expect(onChangeMock).toHaveBeenCalledWith(expectedValue);
  });

  it('désactive le datepicker si disabled=true', () => {
    render(<DatePickerField {...defaultProps} disabled />);
    const input = screen.getByLabelText('Date de test');
    expect(input).toBeDisabled();
  });
});