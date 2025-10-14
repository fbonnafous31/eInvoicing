// src/pages/sellers/SellersList.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SellersList from './SellersList';
import useSellers from '../../modules/sellers/useSellers';
import useSellerColumns from '../../modules/sellers/sellerColumns';
import { MemoryRouter } from 'react-router-dom';

// mock des hooks
vi.mock('../../modules/sellers/useSellers');
vi.mock('../../modules/sellers/sellerColumns');

const renderWithRouter = (ui) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SellersList', () => {
  beforeEach(() => {
    useSellerColumns.mockReturnValue([
      { name: 'Nom', selector: row => row.legal_name },
    ]);
  });

  it('affiche un message de chargement si loading = true', () => {
    useSellers.mockReturnValue({ sellers: [], loading: true, error: null });
    renderWithRouter(<SellersList />);
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  it('affiche un message d’erreur si error est défini', () => {
    useSellers.mockReturnValue({ sellers: [], loading: false, error: 'Erreur !' });
    renderWithRouter(<SellersList />);
    expect(screen.getByText(/Erreur !/i)).toBeInTheDocument();
  });

  it('affiche la liste des sellers', () => {
    const mockSellers = [
      { id: 1, legal_name: 'Alpha' },
      { id: 2, legal_name: 'Beta' },
    ];
    useSellers.mockReturnValue({ sellers: mockSellers, loading: false, error: null });
    renderWithRouter(<SellersList />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('filtre les sellers via l’input', () => {
    const mockSellers = [
      { id: 1, legal_name: 'Alpha' },
      { id: 2, legal_name: 'Beta' },
    ];
    useSellers.mockReturnValue({ sellers: mockSellers, loading: false, error: null });
    renderWithRouter(<SellersList />);
    
    const input = screen.getByPlaceholderText(/Rechercher un vendeur/i);
    fireEvent.change(input, { target: { value: 'Alpha' } });

    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Beta')).toBeNull();
  });
});
