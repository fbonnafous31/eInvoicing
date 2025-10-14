// src/pages/clients/ClientDetail.test.jsx
import { describe, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientDetail from './ClientDetail';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock du service client
const mockClient = {
  id: '1',
  legal_name: 'ACME Corp',
  firstname: 'John',
  lastname: 'Doe',
  total: 1000,
};

const fetchClientMock = vi.fn();
const updateClientMock = vi.fn();
const deleteClientMock = vi.fn();

vi.mock('@/services/clients', () => ({
  useClientService: () => ({
    fetchClient: fetchClientMock,
    updateClient: updateClientMock,
    deleteClient: deleteClientMock,
  }),
}));

// Mock des boutons pour ajouter data-testid
vi.mock('@/components/ui/buttons', () => ({
  EditButton: ({ onClick, children }) => <button data-testid="edit-button" onClick={onClick}>{children}</button>,
  CancelButton: ({ onClick }) => <button data-testid="cancel-button" onClick={onClick}>Annuler</button>,
  DeleteButton: ({ onClick }) => <button data-testid="delete-button" onClick={onClick}>Supprimer</button>,
}));

describe('ClientDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchClientMock.mockResolvedValue(mockClient);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/clients/1']}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetail />} />
        </Routes>
      </MemoryRouter>
    );

  it('affiche les infos client après chargement', async () => {
    renderComponent();

    await waitFor(() => expect(fetchClientMock).toHaveBeenCalledWith('1'));

    expect(screen.getByText(/ACME Corp/i)).toBeInTheDocument();
    expect(screen.getByTestId('edit-button')).toBeInTheDocument();
    expect(screen.getByTestId('delete-button')).toBeInTheDocument();
  });

  it('active le mode édition quand on clique sur Modifier', async () => {
    renderComponent();
    await waitFor(() => expect(fetchClientMock).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('edit-button'));
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
  });

  it('appelle deleteClient quand on confirme la suppression', async () => {
    renderComponent();
    await waitFor(() => expect(fetchClientMock).toHaveBeenCalled());

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    fireEvent.click(screen.getByTestId('delete-button'));

    await waitFor(() => expect(deleteClientMock).toHaveBeenCalledWith('1'));

    // Restaure window.confirm
    window.confirm.mockRestore();
  });
});
