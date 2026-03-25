import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ClientForm from './ClientForm';
import useClientForm from '../../modules/clients/useClientForm';
import { validateClient } from '../../utils/validators/client';

// 1. Mocks
vi.mock('../../modules/clients/useClientForm');
vi.mock('../../utils/validators/client');

describe('ClientForm', () => {
  const mockOnSubmit = vi.fn();
  let hookMock;

  beforeEach(() => {
    vi.resetAllMocks();

    // Configuration du mock du hook
    hookMock = {
      formData: {
        is_company: true,
        legal_name: 'Acme Corp',
        siret: '12345678901234',
        country_code: 'FR',
        email: 'test@client.com',
      },
      errors: {},
      touched: {},
      openSections: {
        legal: true,
        contact: false,
        address: false,
        finances: false,
      },
      toggleSection: vi.fn(),
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
      setErrors: vi.fn(),
      setTouched: vi.fn(),
      checkSiretAPI: vi.fn(async () => ({ valid: true })),
    };

    useClientForm.mockReturnValue(hookMock);
    
    // Par défaut, pas d'erreurs de validation
    validateClient.mockReturnValue({});
  });

  it('affiche les titres des sections et gère le toggle', () => {
    render(<ClientForm onSubmit={mockOnSubmit} />);

    const legalBtn = screen.getByText(/Informations légales/i);
    fireEvent.click(legalBtn);

    expect(hookMock.toggleSection).toHaveBeenCalledWith('legal');
  });

  it('soumet les données formatées si la validation est correcte', async () => {
    render(<ClientForm onSubmit={mockOnSubmit} />);

    const submitBtn = screen.getByRole('button', { name: /Enregistrer/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      // Vérifie que onSubmit reçoit le payload transformé (is_company, legal_name, etc.)
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        is_company: true,
        legal_name: 'Acme Corp'
      }));
    });
  });

  it('bloque la soumission et affiche les erreurs si validateClient échoue', async () => {
    // Simuler une erreur locale
    validateClient.mockReturnValue({ email: 'Email invalide' });

    render(<ClientForm onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(hookMock.setErrors).toHaveBeenCalledWith({ email: 'Email invalide' });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('vérifie le SIRET via l’API si c’est une entreprise en France', async () => {
    render(<ClientForm onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
      expect(hookMock.checkSiretAPI).toHaveBeenCalledWith('12345678901234');
    });
  });

  it('interrompt la soumission si checkSiretAPI renvoie invalide', async () => {
    hookMock.checkSiretAPI.mockResolvedValue({ valid: false });
    hookMock.openSections.legal = false; // Simuler section fermée

    render(<ClientForm onSubmit={mockOnSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => {
      // Doit tenter d'ouvrir la section pour montrer l'erreur
      expect(hookMock.toggleSection).toHaveBeenCalledWith('legal');
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('ne rend pas le bouton Enregistrer si le formulaire est disabled', () => {
    render(<ClientForm onSubmit={mockOnSubmit} disabled={true} />);
    
    const submitBtn = screen.queryByRole('button', { name: /Enregistrer/i });
    expect(submitBtn).toBeNull();
  });
});