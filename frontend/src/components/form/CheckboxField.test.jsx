import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CheckboxField } from './CheckboxField';

describe('CheckboxField', () => {
  it('affiche le label et la checkbox', () => {
    render(
      <CheckboxField
        id="test"
        name="test"
        label="Accepter les conditions"
        checked={false}
        onChange={() => {}}
      />
    );

    expect(screen.getByLabelText(/accepter les conditions/i)).toBeInTheDocument();
  });

  it('reflète l’état checked', () => {
    render(
      <CheckboxField
        id="test"
        name="test"
        label="Checkbox"
        checked={true}
        onChange={() => {}}
      />
    );

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('appelle onChange quand on clique', () => {
    const handleChange = vi.fn();

    render(
      <CheckboxField
        id="test"
        name="test"
        label="Checkbox"
        checked={false}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('est désactivée si disabled=true', () => {
    render(
      <CheckboxField
        id="test"
        name="test"
        label="Checkbox"
        checked={false}
        onChange={() => {}}
        disabled={true}
      />
    );

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});