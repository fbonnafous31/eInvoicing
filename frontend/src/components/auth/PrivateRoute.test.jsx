// frontend/src/components/auth/PrivateRoute.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PrivateRoute from './PrivateRoute';
import { useAuth0 } from '@auth0/auth0-react';

// ----------------------------
// Mock de useAuth0
// ----------------------------
vi.mock('@auth0/auth0-react', () => ({
  useAuth0: vi.fn(),
}));

// ----------------------------
// Mock Navigate pour capturer la redirection
// ----------------------------
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to} />,
  };
});

// ----------------------------
// Tests
// ----------------------------
describe('PrivateRoute', () => {
  it('affiche "Chargement..." quand isLoading est true', () => {
    useAuth0.mockReturnValue({ isLoading: true, isAuthenticated: false });

    render(
      <PrivateRoute>
        <div>Contenu privé</div>
      </PrivateRoute>
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('rend les enfants quand l’utilisateur est authentifié', () => {
    useAuth0.mockReturnValue({ isLoading: false, isAuthenticated: true });

    render(
      <PrivateRoute>
        <div data-testid="private-content">Contenu privé</div>
      </PrivateRoute>
    );

    expect(screen.getByTestId('private-content')).toBeInTheDocument();
  });

  it('redirige vers /login quand l’utilisateur n’est pas authentifié', () => {
    useAuth0.mockReturnValue({ isLoading: false, isAuthenticated: false });

    render(
      <PrivateRoute>
        <div>Contenu privé</div>
      </PrivateRoute>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate.dataset.to).toBe('/login');
  });
});
