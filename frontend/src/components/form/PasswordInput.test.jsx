import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PasswordInput from './PasswordInput';

// Mock des icônes pour éviter le bruit dans les tests
vi.mock('lucide-react', () => ({
  Eye: () => <span>eye</span>,
  EyeOff: () => <span>eye-off</span>,
}));

describe('PasswordInput', () => {
  const getInput = () =>
    screen.getByLabelText('Mot de passe', { selector: 'input' });

  const getToggleButton = () =>
    screen.getByRole('button', { name: /afficher|masquer/i });

  it('affiche le label et l’input', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
      />
    );

    expect(getInput()).toBeInTheDocument();
  });

  it('est de type password par défaut', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
      />
    );

    expect(getInput()).toHaveAttribute('type', 'password');
  });

  it('toggle en text quand on clique', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
      />
    );

    const input = getInput();
    const button = getToggleButton();

    fireEvent.click(button);

    expect(input).toHaveAttribute('type', 'text');
  });

  it('toggle de nouveau en password', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
      />
    );

    const input = getInput();
    const button = getToggleButton();

    fireEvent.click(button);
    fireEvent.click(button);

    expect(input).toHaveAttribute('type', 'password');
  });

  it('appelle onChange avec la valeur', () => {
    const handleChange = vi.fn();

    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={handleChange}
      />
    );

    const input = getInput();

    fireEvent.change(input, { target: { value: '1234' } });

    expect(handleChange).toHaveBeenCalledWith('1234');
  });

  it('est désactivé si disabled=true', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
        disabled
      />
    );

    expect(getInput()).toBeDisabled();
  });

  it('affiche le message d’erreur', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
        error="Erreur"
      />
    );

    expect(screen.getByText('Erreur')).toBeInTheDocument();
  });

  it('affiche le helpText', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
        helpText="Minimum 8 caractères"
      />
    );

    expect(screen.getByText(/minimum 8 caractères/i)).toBeInTheDocument();
  });

  it('change aria-label du bouton', () => {
    render(
      <PasswordInput
        id="password"
        label="Mot de passe"
        value=""
        onChange={() => {}}
      />
    );

    const button = getToggleButton();

    fireEvent.click(button);

    expect(
      screen.getByRole('button', { name: /masquer/i })
    ).toBeInTheDocument();
  });
});