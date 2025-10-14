import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ProfilePage from './ProfilePage';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

// Mock du service
const fetchMySellerMock = vi.fn();

vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    fetchMySeller: fetchMySellerMock,
  }),
}));

// Mock SellerDetail pour test
vi.mock('./SellerDetail', () => ({
  default: ({ sellerId }) => (
    <div data-testid="seller-detail">SellerDetail {sellerId}</div>
  ),
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    fetchMySellerMock.mockReset();
  });

  it('affiche "Chargement..." au début', () => {
    fetchMySellerMock.mockReturnValue(new Promise(() => {}));
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('affiche un message si fetchMySeller échoue', async () => {
    fetchMySellerMock.mockRejectedValue(new Error('Erreur serveur'));
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    const errorEl = await screen.findByText(/Erreur serveur/i);
    expect(errorEl).toBeInTheDocument();
  });

  it('affiche SellerDetail si seller valide', async () => {
    fetchMySellerMock.mockResolvedValue({ id: 42 });
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    const sellerDetail = await screen.findByTestId('seller-detail');
    expect(sellerDetail).toBeInTheDocument();
    expect(sellerDetail).toHaveTextContent('SellerDetail 42');
  });

  it('affiche un message si seller invalide', async () => {
    fetchMySellerMock.mockResolvedValue(null);
    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );

    const errorEl = await screen.findByText(/Profil invalide ou incomplet/i);
    expect(errorEl).toBeInTheDocument();
  });
});
