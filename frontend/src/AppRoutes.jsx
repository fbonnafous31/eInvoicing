// frontend/src/AppRoutes.jsx
import Home from './pages/Home';
import ProfilePage from './pages/sellers/ProfilePage';

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

import AuthTest from './pages/AuthTest.jsx';
import NotFound from './pages/NotFound';

import RequireSeller from './components/guard/RequireSeller';

const routes = [
  { path: '/', element: <Home /> },

  // Profil utilisateur (vendeur connecté)
  { path: '/seller', element: 
    <RequireSeller>
      <ProfilePage />
    </RequireSeller>
  },

  // Sellers
  { path: '/sellers', element: 
    <RequireSeller>
      <SellersList />
    </RequireSeller>
  },
  { path: '/sellers/new', element: <NewSeller /> },
  { path: '/sellers/:id', element: 
    <RequireSeller>
      <SellerDetail />
    </RequireSeller>
  },

  // Clients
  { path: '/clients', element: 
    <RequireSeller>
      <ClientsList />
    </RequireSeller>
  },
  { path: '/clients/new', element: 
    <RequireSeller>
      <NewClient />
    </RequireSeller>
  },
  { path: '/clients/:id', element: 
    <RequireSeller>
      <ClientDetail />
    </RequireSeller>
  },

  // Invoices
  { path: '/invoices', element: 
    <RequireSeller>
      <InvoicesList />
    </RequireSeller>
  },
  { path: '/invoices/new', element: 
    <RequireSeller>
      <NewInvoice />
    </RequireSeller>
  },
  { path: '/invoices/:id', element: 
    <RequireSeller>
      <InvoiceDetail />
    </RequireSeller>
  },
  { path: '/invoices/:id/view', element: 
    <RequireSeller>
      <InvoiceView />
    </RequireSeller>
  },  

  // Test PDFViewer
  { path: '/test-pdf', element: <TestPdfViewer /> },

  // Test Auth0
  { path: '/auth-test', element: <AuthTest /> },

  // 404
  { path: '*', element: <NotFound /> },
];

export default routes;
