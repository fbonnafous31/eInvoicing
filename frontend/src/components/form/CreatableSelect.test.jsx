import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CreatableSelect from './CreatableSelect';

describe('CreatableSelect', () => {
  it('affiche le label', () => {
    render(<CreatableSelect label="Client" name="client" />);
    expect(screen.getByText(/client/i)).toBeInTheDocument();
  });

  it('appelle onChange', async () => {
    const handleChange = vi.fn();

    render(
      <CreatableSelect
        name="client"
        onChange={handleChange}
        options={[{ value: 'new-value', label: 'New Value' }]}
      />
    );

    // récupère l'input via role combobox (React-Select)
    const input = screen.getByRole('combobox');

    // simule la saisie + validation
    fireEvent.change(input, { target: { value: 'new-value' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(handleChange).toHaveBeenCalled();
  });

  it('appelle onBlur avec le name', () => {
    const handleBlur = vi.fn();

    render(<CreatableSelect name="client" onBlur={handleBlur} />);

    const input = screen.getByRole('combobox');
    fireEvent.blur(input);

    expect(handleBlur).toHaveBeenCalledWith('client');
  });

  it('affiche une erreur explicite', () => {
    render(<CreatableSelect error="Erreur test" />);
    expect(screen.getByText('Erreur test')).toBeInTheDocument();
  });

  it('affiche une erreur si required sans valeur', () => {
    render(<CreatableSelect required value={null} />);
    expect(screen.getByText(/champ est obligatoire/i)).toBeInTheDocument();
  });

  it('affiche le feedback si pas d’erreur', () => {
    render(
      <CreatableSelect
        feedbackText="OK"
        feedbackClass="text-success"
        value={{ label: 'test', value: 'test' }}
      />
    );
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('n’affiche pas le feedback si erreur', () => {
    render(
      <CreatableSelect
        error="Erreur"
        feedbackText="OK"
      />
    );
    expect(screen.queryByText('OK')).not.toBeInTheDocument();
  });
});