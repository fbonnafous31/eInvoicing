import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CancelInvoiceButton from './CancelInvoiceButton';

// mock pour window.alert
vi.stubGlobal('alert', vi.fn());

describe('CancelInvoiceButton', () => {
  it('ouvre le modal quand on clique sur le bouton', () => {
    render(<CancelInvoiceButton />);
    
    // modal fermé au départ
    expect(screen.queryByText(/Annuler la facture/i)).not.toBeInTheDocument();

    const button = screen.getByText(/❌ Annuler/i);
    fireEvent.click(button);

    // modal visible après clic
    expect(screen.getByText(/Annuler la facture/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Erreur de saisie/i)).toBeInTheDocument();
  });

  it('alerte si le motif est vide et on clique sur confirmer', () => {
    const onCancel = vi.fn();
    render(<CancelInvoiceButton onCancel={onCancel} />);

    fireEvent.click(screen.getByText(/❌ Annuler/i));
    fireEvent.click(screen.getByText(/Confirmer l'annulation/i));

    expect(alert).toHaveBeenCalledWith("Veuillez saisir un motif d'annulation");
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('appelle onCancel avec le motif et ferme le modal', async () => {
    const onCancel = vi.fn();
    render(<CancelInvoiceButton onCancel={onCancel} />);

    fireEvent.click(screen.getByText(/❌ Annuler/i));

    const input = screen.getByPlaceholderText(/Ex: Erreur de saisie/i);
    fireEvent.change(input, { target: { value: 'Erreur client' } });

    fireEvent.click(screen.getByText(/Confirmer l'annulation/i));

    expect(onCancel).toHaveBeenCalledWith('Erreur client');

    // attendre que le modal disparaisse
    await waitFor(() =>
      expect(screen.queryByText(/Annuler la facture/i)).not.toBeInTheDocument()
    );
  });

  it('ferme le modal quand on clique sur le bouton Annuler du modal', async () => {
    render(<CancelInvoiceButton />);

    fireEvent.click(screen.getByText(/❌ Annuler/i));

    fireEvent.click(screen.getByText(/^Annuler$/i)); // bouton secondaire du modal

    await waitFor(() =>
      expect(screen.queryByText(/Annuler la facture/i)).not.toBeInTheDocument()
    );
  });
});