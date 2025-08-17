import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

// Layout
function Layout({ children }) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
    </>
  );
}

// Sellers
import SellersList from './pages/sellers/SellersList';
import NewSeller from './pages/sellers/NewSeller';
import SellerDetail from './pages/sellers/SellerDetail';

// Clients
import ClientsList from './pages/clients/ClientsList';
import NewClient from './pages/clients/NewClient';
import ClientDetail from './pages/clients/ClientDetail';

// Invoices
import InvoicesList from './pages/invoices/InvoicesList';
import InvoiceForm from './components/invoices/InvoiceForm';

// 404
function NotFound() {
  return <h2>Page non trouvée</h2>;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Sellers */}
        <Route path="/sellers" element={<Layout><SellersList /></Layout>} />
        <Route path="/sellers/new" element={<Layout><NewSeller /></Layout>} />
        <Route path="/sellers/:id" element={<Layout><SellerDetail /></Layout>} />

        {/* Clients */}
        <Route path="/clients" element={<Layout><ClientsList /></Layout>} />
        <Route path="/clients/new" element={<Layout><NewClient /></Layout>} />
        <Route path="/clients/:id" element={<Layout><ClientDetail /></Layout>} />

        {/* Invoices */}
        <Route path="/invoices" element={<Layout><InvoicesList /></Layout>} />
        <Route path="/invoices/new" element={<Layout><InvoiceForm /></Layout>} />

        {/* 404 */}
        <Route path="*" element={<Layout><NotFound /></Layout>} />
      </Routes>
    </Router>
  );
}

export default App;
