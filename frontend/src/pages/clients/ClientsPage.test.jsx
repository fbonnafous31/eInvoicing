import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import ClientsPage from './ClientsPage';
import { useClientService } from '@/services/clients';

// 1. Mock du hook personnalisé
vi.mock('@/services/clients', () => ({
  useClientService: vi.fn()
}));

// Mock des sous-composants pour isoler la logique de la page (Optionnel mais recommandé)
vi.mock('./ClientsList', () => ({
  default: ({ clients }) => (
    <ul data-testid="client-list">
      {clients.map(c => <li key={c.id}>{c.name}</li>)}
    </ul>
  )
}));

vi.mock('./ClientForm', () => ({
  default: ({ onSubmit }) => (
    <button onClick={() => onSubmit({ id: 2, name: 'Nouveau Client' })}>
      Ajouter Client
    </button>
  )
}));

describe('ClientsPage', () => {
  const mockClients = [{ id: 1, name: 'Client Existant' }];
  
  const mockFetchClients = vi.fn();
  useClientService.mockReturnValue({
    fetchClients: mockFetchClients
  });

  it('charge et affiche les clients au montage', async () => {
    mockFetchClients.mockResolvedValueOnce(mockClients);

    render(<ClientsPage />);

    // On attend que le service soit appelé
    expect(mockFetchClients).toHaveBeenCalled();

    // On vérifie que le client mocké est affiché
    const clientItem = await screen.findByText('Client Existant');
    expect(clientItem).toBeDefined();
  });

  it('ajoute un nouveau client à la liste quand le formulaire est soumis', async () => {
    mockFetchClients.mockResolvedValueOnce(mockClients);
    
    render(<ClientsPage />);

    // On attend le chargement initial
    await screen.findByText('Client Existant');

    // Simulation du clic sur le bouton du formulaire mocké
    const addButton = screen.getByText('Ajouter Client');
    fireEvent.click(addButton);

    // Vérification que les deux clients sont là (le nouveau doit être en premier)
    const list = screen.getByTestId('client-list');
    expect(list.children.length).toBe(2);
    expect(list.children[0].textContent).toBe('Nouveau Client');
  });

  it('gère les erreurs de chargement proprement', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFetchClients.mockRejectedValueOnce(new Error('API Error'));

    render(<ClientsPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Erreur chargement clients :", expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});