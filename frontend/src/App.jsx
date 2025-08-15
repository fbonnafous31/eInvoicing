import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar';

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

function App() {
  return (
    <Router>
      <NavBar />
      <Routes>
        {/* Sellers */}
        <Route path="/sellers" element={<SellersList />} />
        <Route path="/sellers/new" element={<NewSeller />} />
        <Route path="/sellers/:id" element={<SellerDetail />} />

        {/* Clients */}
        <Route path="/clients" element={<ClientsList />} />
        <Route path="/clients/new" element={<NewClient />} />
        <Route path="/clients/:id" element={<ClientDetail />} />

        {/* Invoices */}
        <Route path="/invoices" element={<InvoicesList />} />
        <Route path="/invoices/new" element={<InvoiceForm />} /> 
        
      </Routes>
    </Router>
  );
}

export default App;

