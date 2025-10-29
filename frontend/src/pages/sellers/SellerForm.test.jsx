// frontend/src/pages/sellers/SellerForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import SellerForm from './SellerForm';

// Mock useNavigate pour éviter les erreurs
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock useSellerForm pour isoler le formulaire
const mockFormData = {
  legal_name: '',
  legal_identifier: '',
  company_type: '',
  smtp: { active: true, smtp_host: '', smtp_port: '', smtp_user: '', smtp_pass: '', smtp_from: '' },
};

const mockUseSellerForm = {
  formData: mockFormData,
  errors: {},
  touched: {},
  openSections: { legal: true, smtp: true },
  toggleSection: vi.fn(),
  handleChange: vi.fn(),
  handleBlur: vi.fn(),
  setErrors: vi.fn(),
  setTouched: vi.fn(),
  checkIdentifierAPI: vi.fn(() => Promise.resolve({ valid: true })),
};

vi.mock('../../modules/sellers/useSellerForm', () => ({
  default: () => mockUseSellerForm,
}));

// Mock validateSeller pour isoler la validation
vi.mock('../../utils/validators/seller', () => ({
  validateSeller: vi.fn(() => ({})),
}));

// Mock SaveButton pour simplifier
vi.mock('@/components/ui/buttons/SaveButton', () => ({
  default: () => <button>Save</button>,
}));

// Helper pour rendre avec router
const renderWithRouter = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SellerForm', () => {
  it('rend correctement le formulaire', () => {
    renderWithRouter(<SellerForm />);
    expect(screen.getByText(/Informations légales/i)).toBeInTheDocument();
    expect(screen.getByText(/Paramètres SMTP/i)).toBeInTheDocument();
    expect(screen.getByText(/Save/i)).toBeInTheDocument();
  });

  it('valide les champs SMTP et empêche la soumission si erreur', async () => {
    const onSubmit = vi.fn();
    renderWithRouter(<SellerForm onSubmit={onSubmit} />);

    // forcer des erreurs SMTP
    mockUseSellerForm.formData.smtp = {
      active: true,
      smtp_host: '',
      smtp_port: '',
      smtp_user: '',
      smtp_pass: '',
      smtp_from: '',
    };

    fireEvent.click(screen.getByText(/Save/i));

    await waitFor(() => {
      expect(mockUseSellerForm.setErrors).toHaveBeenCalled();
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });
});
