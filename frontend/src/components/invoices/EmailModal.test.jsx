import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import EmailModal from './EmailModal';

describe('EmailModal', () => {
  const onSend = vi.fn();
  const onClose = vi.fn();
  const defaultValues = {
    to: '',
    subject: 'Sujet test',
    message: 'Message test',
  };

  it('affiche la modale avec le titre', () => {
    render(<EmailModal show={true} onClose={onClose} onSend={onSend} defaultValues={defaultValues} />);
    expect(screen.getByText(/Envoyer la facture par email/i)).toBeDefined();
  });

  it('désactive le bouton Envoyer si l’email est vide', () => {
    render(<EmailModal show={true} onClose={onClose} onSend={onSend} defaultValues={defaultValues} />);
    const sendButton = screen.getByRole('button', { name: /Envoyer/i });
    expect(sendButton).toBeDisabled();
  });

  it('montre une erreur si l’email est invalide', () => {
    render(
        <EmailModal
        show={true}
        onClose={onClose}
        onSend={onSend}
        defaultValues={{ ...defaultValues, to: 'invalide' }}
        />
    );

    // Vérifie qu'au moins un alert contenant le texte est présent
    const alerts = screen.getAllByText(/Format d'email invalide|L'email est obligatoire/i);
    expect(alerts.length).toBeGreaterThan(0);

    // Vérifie que le bouton Envoyer est bien désactivé
    const sendButton = screen.getByRole('button', { name: /Envoyer/i });
    expect(sendButton).toBeDisabled();
  });

  it('appelle onSend si l’email est valide et bouton cliqué', () => {
    render(<EmailModal show={true} onClose={onClose} onSend={onSend} defaultValues={{ ...defaultValues, to: 'test@example.com' }} />);
    const sendButton = screen.getByRole('button', { name: /Envoyer/i });
    fireEvent.click(sendButton);
    expect(onSend).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Sujet test',
      message: 'Message test',
    });
  });
});
