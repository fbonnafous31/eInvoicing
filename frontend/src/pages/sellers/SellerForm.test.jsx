import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SellerForm from './SellerForm';
import { useNavigate } from 'react-router-dom';
import useSellerForm from '../../modules/sellers/useSellerForm';
import { validateSeller } from '../../utils/validators/seller';

// 1. Mocks des dépendances
vi.mock('../../modules/sellers/useSellerForm');
vi.mock('../../utils/validators/seller'); // Mock du validateur externe
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

describe('SellerForm', () => {
  const mockNavigate = vi.fn();
  const mockOnSubmit = vi.fn();

  let hookMock;

  beforeEach(() => {
    vi.resetAllMocks();
    useNavigate.mockReturnValue(mockNavigate);

    // Initialisation du mock du hook
    hookMock = {
      formData: {
        legal_name: 'Test Corp',
        legal_identifier: '12345678901234',
        country_code: 'FR',
        smtp: { active: false },
      },
      errors: {},
      touched: {},
      openSections: {
        legal: true, // On l'ouvre par défaut pour faciliter certains tests
        contact: false,
        address: false,
        finances: false,
        mentions: false,
        smtp: false,
      },
      toggleSection: vi.fn(),
      handleChange: vi.fn(),
      handleBlur: vi.fn(),
      setErrors: vi.fn(),
      setTouched: vi.fn(),
      checkIdentifierAPI: vi.fn(async () => ({ valid: true })),
    };

    useSellerForm.mockReturnValue(hookMock);
    
    // Par défaut, le validateur ne retourne aucune erreur
    validateSeller.mockReturnValue({});
  });

  it('rend le formulaire et appelle toggleSection au clic sur une section', () => {
    render(<SellerForm onSubmit={mockOnSubmit} />);

    // Utilisation d'une regex pour ignorer les emojis ou espaces bizarres
    const sectionButton = screen.getByText(/Informations légales/i);
    fireEvent.click(sectionButton);
    
    expect(hookMock.toggleSection).toHaveBeenCalledWith('legal');
  });

  it('soumet le formulaire avec succès si aucune erreur n’est présente', async () => {
    render(<SellerForm onSubmit={mockOnSubmit} />);

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      // On vérifie que onSubmit a été appelé avec les données formatées
      // Le composant fusionne formData et formData.smtp dans le payload
      expect(mockOnSubmit).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('ne soumet pas le formulaire si validateSeller retourne des erreurs', async () => {
    // Simuler une erreur de validation
    validateSeller.mockReturnValue({ legal_name: 'Requis' });
    
    render(<SellerForm onSubmit={mockOnSubmit} />);

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(hookMock.setErrors).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  it('vérifie le doublon SIRET si le matricule a changé', async () => {
    // On change le matricule par rapport à l'initialData (qui est vide {} par défaut)
    render(<SellerForm onSubmit={mockOnSubmit} initialData={{ legal_identifier: '000' }} />);

    const saveButton = screen.getByRole('button', { name: /Enregistrer/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(hookMock.checkIdentifierAPI).toHaveBeenCalled();
    });
  });
});