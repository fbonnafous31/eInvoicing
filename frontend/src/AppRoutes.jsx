// frontend/src/AppRoutes.jsx
import SellersList from './pages/sellers/SellersList';
import NewSeller from './pages/sellers/NewSeller';
import SellerDetail from './pages/sellers/SellerDetail';

import ClientsList from './pages/clients/ClientsList';
import NewClient from './pages/clients/NewClient';
import ClientDetail from './pages/clients/ClientDetail';

import InvoicesList from './pages/invoices/InvoicesList';
import NewInvoice from './pages/invoices/NewInvoice';
import InvoiceDetail from './pages/invoices/InvoiceDetail';
import InvoiceView from './pages/invoices/InvoiceView';
import TestPdfViewer from './components/invoices/TestPdfViewer'; 

import NotFound from './pages/NotFound';

const routes = [
  // Sellers
  { path: '/sellers', element: <SellersList /> },
  { path: '/sellers/new', element: <NewSeller /> },
  { path: '/sellers/:id', element: <SellerDetail /> },

  // Clients
  { path: '/clients', element: <ClientsList /> },
  { path: '/clients/new', element: <NewClient /> },
  { path: '/clients/:id', element: <ClientDetail /> },

  // Invoices
  { path: '/invoices', element: <InvoicesList /> },
  { path: '/invoices/new', element: <NewInvoice /> },
  { path: '/invoices/:id', element: <InvoiceDetail /> },
  { path: '/invoices/:id/view', element: <InvoiceView /> },  

  // Test PDFViewer
  { path: '/test-pdf', element: <TestPdfViewer /> },

  // 404
  { path: '*', element: <NotFound /> },
];

export default routes;
