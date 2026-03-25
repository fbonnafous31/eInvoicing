// src/components/invoices/InvoiceEmailButton.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Mock du composant EmailModal ────────────────────────────────
// ⚠️ Doit être avant l'import du composant testé
vi.mock('./EmailModal', () => ({
  default: ({ show, onClose, onSend, defaultValues }) => {
    if (!show) return null;
    return (
      <div data-testid="email-modal">
        <button onClick={() => onSend(defaultValues)}>Send</button>
        <button onClick={onClose}>Close</button>
      </div>
    );
  },
}));

import InvoiceEmailButton from './InvoiceEmailButton';

describe('InvoiceEmailButton', () => {
  let alertMock;
  let consoleMock;

  beforeEach(() => {
    vi.clearAllMocks();
    alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    consoleMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('affiche le bouton d’envoi', () => {
    render(<InvoiceEmailButton row={{ id: 1 }} sendInvoiceMail={vi.fn()} />);
    expect(screen.getByTitle('Envoyer la facture par email')).toBeInTheDocument();
  });

  it('ouvre la modal au clic', () => {
    render(<InvoiceEmailButton row={{ id: 1 }} sendInvoiceMail={vi.fn()} />);
    fireEvent.click(screen.getByTitle('Envoyer la facture par email'));
    expect(screen.getByTestId('email-modal')).toBeInTheDocument();
  });

  it('appelle sendInvoiceMail et affiche alert en cas de succès', async () => {
    const sendInvoiceMail = vi.fn().mockResolvedValue({});
    const row = { 
      id: 1, 
      client: { email: 'test@example.com', legal_name: 'Client A' }, 
      seller: { legal_name: 'Société X' }, 
      invoice_number: '123' 
    };

    render(<InvoiceEmailButton row={row} sendInvoiceMail={sendInvoiceMail} />);

    fireEvent.click(screen.getByTitle('Envoyer la facture par email'));
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(sendInvoiceMail).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ to: 'test@example.com' })
      );
      expect(alertMock).toHaveBeenCalledWith('📧 Facture envoyée par email !');
    });
  });

  it('affiche alert en cas d’erreur', async () => {
    const sendInvoiceMail = vi.fn().mockRejectedValue(new Error('Erreur test'));
    render(<InvoiceEmailButton row={{ id: 1 }} sendInvoiceMail={sendInvoiceMail} />);

    fireEvent.click(screen.getByTitle('Envoyer la facture par email'));
    fireEvent.click(screen.getByText('Send'));

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith("❌ Erreur lors de l'envoi : Erreur test");
    });
  });
});