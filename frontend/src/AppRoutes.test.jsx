// src/AppRoutes.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import routes from './AppRoutes.jsx';

// --- Mocks globaux ---

// Mock des pages pour simplifier le test
vi.mock('./pages/Home', () => ({ default: () => <div>Home Mock</div> }));
vi.mock('./pages/sellers/ProfilePage', () => ({ default: () => <div>ProfilePage Mock</div> }));
vi.mock('./pages/sellers/NewSeller', () => ({ default: () => <div>NewSeller Mock</div> }));
vi.mock('./pages/clients/ClientsList', () => ({ default: () => <div>ClientsList Mock</div> }));
vi.mock('./pages/clients/NewClient', () => ({ default: () => <div>NewClient Mock</div> }));
vi.mock('./pages/invoices/InvoicesList', () => ({ default: () => <div>InvoicesList Mock</div> }));
vi.mock('./pages/invoices/NewInvoice', () => ({ default: () => <div>NewInvoice Mock</div> }));
vi.mock('./pages/invoices/InvoiceView', () => ({ default: () => <div>InvoiceView Mock</div> }));
vi.mock('./pages/AuthTest', () => ({ default: () => <div>AuthTest Mock</div> }));
vi.mock('./pages/NotFound', () => ({ default: () => <div>NotFound Mock</div> }));
vi.mock('./components/invoices/TestPdfViewer', () => ({ default: () => <div>TestPdfViewer Mock</div> }));

// Mock des guards pour qu’ils laissent passer
vi.mock('./components/guard/RequireSeller', () => ({ default: ({ children }) => <>{children}</> }));
vi.mock('./components/guard/RequireNoSeller', () => ({ default: ({ children }) => <>{children}</> }));

// Mock react-pdf pour éviter DOMMatrix
vi.mock('react-pdf', () => ({
  Document: ({ children }) => <div data-testid="Document">{children}</div>,
  Page: () => <div data-testid="Page" />,
  pdfjs: { GlobalWorkerOptions: { workerSrc: '' } },
}));

// --- Tests ---
describe('AppRoutes', () => {
  const renderRoute = (initialEntries = ['/']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          {routes.map(({ path, element }) => (
            <Route key={path} path={path} element={element} />
          ))}
        </Routes>
      </MemoryRouter>
    );
  };

  it('rend la page Home sur /', () => {
    renderRoute(['/']);
    expect(screen.getByText(/Home Mock/i)).toBeInTheDocument();
  });

  it('rend ProfilePage via /seller', () => {
    renderRoute(['/seller']);
    expect(screen.getByText(/ProfilePage Mock/i)).toBeInTheDocument();
  });

  it('rend NewSeller via /sellers/new', () => {
    renderRoute(['/sellers/new']);
    expect(screen.getByText(/NewSeller Mock/i)).toBeInTheDocument();
  });

  it('redirige /sellers vers /seller', () => {
    renderRoute(['/sellers']);
    expect(screen.getByText(/ProfilePage Mock/i)).toBeInTheDocument();
  });

  it('rend NotFound pour une route inconnue', () => {
    renderRoute(['/unknown-route']);
    expect(screen.getByText(/NotFound Mock/i)).toBeInTheDocument();
  });

  it('rend TestPdfViewer pour /test-pdf', () => {
    renderRoute(['/test-pdf']);
    expect(screen.getByText(/TestPdfViewer Mock/i)).toBeInTheDocument();
  });

  it('rend AuthTest pour /auth-test', () => {
    renderRoute(['/auth-test']);
    expect(screen.getByText(/AuthTest Mock/i)).toBeInTheDocument();
  });
});
