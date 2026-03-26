// EmailModal.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, beforeEach } from 'vitest';
import EmailModal from './EmailModal';
import * as validators from '../../utils/validators/email';

describe('EmailModal', () => {
  const defaultValues = {
    to: 'client@test.com',
    subject: 'Facture',
    message: 'Voici votre facture',
  };
  let onSendMock;
  let onCloseMock;

  beforeEach(() => {
    onSendMock = vi.fn();
    onCloseMock = vi.fn();
    vi.clearAllMocks();
  });

  it('affiche les valeurs par défaut', () => {
    render(<EmailModal show={true} onSend={onSendMock} onClose={onCloseMock} defaultValues={defaultValues} />);
    
    expect(screen.getByDisplayValue('client@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Facture')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Voici votre facture')).toBeInTheDocument();
  });

  it('envoie l’email si valide et ferme la modal', async () => {
    render(<EmailModal show={true} onSend={onSendMock} onClose={onCloseMock} defaultValues={defaultValues} />);

    fireEvent.click(screen.getByText('Envoyer'));

    await waitFor(() => {
      expect(onSendMock).toHaveBeenCalledWith(defaultValues);
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('appelle onClose si on clique sur Annuler', () => {
    render(<EmailModal show={true} onSend={onSendMock} onClose={onCloseMock} defaultValues={defaultValues} />);
    
    fireEvent.click(screen.getByText('Annuler'));
    expect(onCloseMock).toHaveBeenCalled();
  });
});