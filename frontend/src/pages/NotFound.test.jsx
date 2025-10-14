// frontend/src/pages/NotFound.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NotFound from './NotFound';

// ----------------------------
// Mock react-router-dom
// ----------------------------
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useLocation: vi.fn(),
    Navigate: ({ to, replace }) => <div data-testid="navigate" data-to={to} data-replace={replace} />,
  };
});

import { useLocation } from 'react-router-dom';

describe('NotFound page', () => {
  it('redirige vers la page d’accueil', () => {
    // On simule un pathname d’accès impossible
    useLocation.mockReturnValue({ pathname: '/page-inexistante' });

    render(<NotFound />);

    // Vérifie que Navigate est rendu avec la bonne cible
    const navigate = screen.getByTestId('navigate');
    expect(navigate.dataset.to).toBe('/');
    expect(navigate.dataset.replace).toBe('true');
  });
});
