import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import SellerDetail from './SellerDetail';

// --- Mock service ---
const fetchMySellerMock = vi.fn();
const updateSellerMock = vi.fn();

vi.mock('@/services/sellers', () => ({
  useSellerService: () => ({
    fetchMySeller: fetchMySellerMock,
    updateSeller: updateSellerMock,
  }),
}));

// --- Mock SellerForm (on ne veut pas tester son comportement ici) ---
vi.mock('./SellerForm', () => ({
  default: ({ disabled, initialData, onSubmit }) => (
    <div data-testid="seller-form">
      <span>SellerForm</span>
      <span>disabled: {String(disabled)}</span>
      <span>legal_name: {initialData?.legal_name}</span>
      {onSubmit && (
        <button onClick={() => onSubmit({ legal_name: "Nouveau nom" })}>
          submit-mock
        </button>
      )}
    </div>
  ),
}));

// --- Mock Breadcrumb (inutile dans ce test) ---
vi.mock('../../components/layout/Breadcrumb', () => ({
  default: () => <div data-testid="breadcrumb" />,
}));

// Helper de rendu avec route dynamique
function renderWithRoute(id = "42") {
  return render(
    <MemoryRouter initialEntries={[`/sellers/${id}`]}>
      <Routes>
        <Route path="/sellers/:id" element={<SellerDetail />} />
      </Routes>
    </MemoryRouter>
  );
}

describe('SellerDetail', () => {
  beforeEach(() => {
    fetchMySellerMock.mockReset();
    updateSellerMock.mockReset();
  });

  it('affiche "Chargement..." avant le fetch', () => {
    fetchMySellerMock.mockReturnValue(new Promise(() => {})); // pending
    renderWithRoute();
    expect(screen.getByText(/Chargement/i)).toBeInTheDocument();
  });

  it('affiche le formulaire avec les données lorsque fetch réussit', async () => {
    fetchMySellerMock.mockResolvedValue({ id: 42, legal_name: 'ACME Corp' });

    renderWithRoute();

    expect(await screen.findByTestId('seller-form')).toBeInTheDocument();
    expect(screen.getByText(/legal_name: ACME Corp/i)).toBeInTheDocument();
  });

  it('active le mode édition après clic sur Modifier', async () => {
    fetchMySellerMock.mockResolvedValue({ id: 42, legal_name: 'ACME Corp' });

    renderWithRoute();
    await screen.findByTestId('seller-form');

    fireEvent.click(screen.getByText(/modifier/i));

    expect(screen.getByText(/disabled: false/i)).toBeInTheDocument();
  });

  it('désactive le mode édition après clic sur Annuler', async () => {
    fetchMySellerMock.mockResolvedValue({ id: 42, legal_name: 'ACME Corp' });

    renderWithRoute();
    await screen.findByTestId('seller-form');

    fireEvent.click(screen.getByText(/modifier/i));
    fireEvent.click(screen.getByText(/annuler/i)); // CancelButton

    expect(screen.getByText(/disabled: true/i)).toBeInTheDocument();
  });

  it('reste en "Chargement..." si fetchMySeller échoue (comportement actuel)', async () => {
    fetchMySellerMock.mockRejectedValue(new Error("boom"));

    renderWithRoute();

    // Chargement reste affiché
    expect(await screen.findByText(/Chargement/i)).toBeInTheDocument();

    // L'erreur n'est pas affichée à l'écran (comportement actuel du composant)
    expect(screen.queryByText(/Erreur lors du chargement du vendeur/i)).not.toBeInTheDocument();
  });
});
