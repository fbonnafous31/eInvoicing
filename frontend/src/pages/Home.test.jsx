// frontend/src/pages/Home.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './Home';
import { useNavigate } from 'react-router-dom';
import { useSellerService } from '@/services/sellers';
import { useInvoiceService } from '@/services/invoices';

// Mock navigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

// Mock services
vi.mock('@/services/sellers', () => ({
  useSellerService: vi.fn(),
}));

vi.mock('@/services/invoices', () => ({
  useInvoiceService: vi.fn(),
}));

describe('Home page', () => {
  it('affiche Chargement au départ', () => {
    useSellerService.mockReturnValue({ fetchMySeller: vi.fn(() => new Promise(() => {})) });
    useInvoiceService.mockReturnValue({ fetchInvoicesBySeller: vi.fn() });
    useNavigate.mockReturnValue(vi.fn());

    render(<Home />);
    expect(screen.getByText('Chargement…')).toBeDefined();
  });

  it('redirige vers création de fiche vendeur si pas de seller', async () => {
    const mockNavigate = vi.fn();
    useNavigate.mockReturnValue(mockNavigate);

    useSellerService.mockReturnValue({ fetchMySeller: async () => null });
    useInvoiceService.mockReturnValue({ fetchInvoicesBySeller: vi.fn() });

    render(<Home />);

    // on attend que le composant finisse de charger
    await new Promise((r) => setTimeout(r, 0));

    const button = screen.getByText('Créer ma fiche vendeur');
    expect(button).toBeDefined();

    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/sellers/new');
  });
});
