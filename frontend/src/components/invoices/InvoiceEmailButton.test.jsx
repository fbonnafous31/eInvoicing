import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import InvoiceEmailButton from './InvoiceEmailButton';

describe('InvoiceEmailButton', () => {
  it('affiche le bouton d’envoi', () => {
    render(<InvoiceEmailButton row={{ id: 1 }} sendInvoiceMail={vi.fn()} />);
    expect(screen.getByTitle('Envoyer la facture par email')).toBeInTheDocument();
  });
});
