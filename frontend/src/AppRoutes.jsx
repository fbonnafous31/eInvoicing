import Home from './pages/Home';
import ProfilePage from './pages/sellers/ProfilePage';
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
import RequireNoSeller from './components/guard/RequireNoSeller.jsx';
import { Navigate } from "react-router-dom";

const routes = [
  { path: '/', element: <Home /> },

  // Profil utilisateur (vendeur connecté)
  { path: '/seller', element: 
    <RequireSeller>
      <ProfilePage />
    </RequireSeller>
  },

  // Création vendeur (accessible uniquement si pas encore de vendeur)
  { path: '/sellers/new', element: 
    <RequireNoSeller>
      <NewSeller />
    </RequireNoSeller>
  },

  // Redirection /sellers -> /seller
  { path: '/sellers', element: <Navigate to="/seller" replace /> },

  // (optionnel) accès direct à un vendeur par ID
  // à supprimer pour vraiment interdire toute lecture d'autres vendeurs
  // { path: '/sellers/:id', element: <SellerDetail /> },

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
