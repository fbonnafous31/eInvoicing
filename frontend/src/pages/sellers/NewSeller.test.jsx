// src/pages/sellers/NewSeller.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, beforeEach, describe, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import NewSeller from './NewSeller';

// 🔹 Mock des composants enfants
vi.mock('../sellers/SellerForm', () => ({
  default: ({ onSubmit, disabled }) => (
    <button
      data-testid="submit-button"
      disabled={disabled}
      onClick={() => onSubmit({ legal_name: 'Test' })}
    >
      Submit
    </button>
  ),
}));

vi.mock('../../components/layout/Breadcrumb', () => ({
  default: ({ items }) => <nav data-testid="breadcrumb">{items.map(i => i.label).join(' > ')}</nav>,
}));

// 🔹 Mock du hook useSellerService
const createSellerMock = vi.fn();
vi.mock('../../services/sellers', () => ({
  useSellerService: () => ({ createSeller: createSellerMock }),
}));

// 🔹 Mock useNavigate avec un mock global
const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

describe('NewSeller', () => {
  beforeEach(() => {
    createSellerMock.mockReset();
    navigateMock.mockReset();
  });

  it('affiche les breadcrumbs', () => {
    render(
      <MemoryRouter>
        <NewSeller />
      </MemoryRouter>
    );
    expect(screen.getByTestId('breadcrumb')).toHaveTextContent('Accueil > Vendeurs > Nouveau vendeur');
  });

  it('appelle createSeller et affiche le message de succès', async () => {
    createSellerMock.mockResolvedValueOnce({});
    render(
      <MemoryRouter>
        <NewSeller />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(createSellerMock).toHaveBeenCalledWith({ legal_name: 'Test' }));
    expect(await screen.findByText(/Vendeur créé avec succès/)).toBeInTheDocument();
  });

  it('affiche un message d’erreur si createSeller échoue', async () => {
    createSellerMock.mockRejectedValueOnce(new Error('Boom'));
    render(
      <MemoryRouter>
        <NewSeller />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(screen.getByText('Boom')).toBeInTheDocument());
  });

  it('désactive le formulaire pendant la soumission', async () => {
    let resolvePromise;
    createSellerMock.mockReturnValue(
      new Promise(res => {
        resolvePromise = res;
      })
    );

    render(
      <MemoryRouter>
        <NewSeller />
      </MemoryRouter>
    );

    const button = screen.getByTestId('submit-button');
    fireEvent.click(button);

    expect(button).toBeDisabled();

    resolvePromise({});
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
