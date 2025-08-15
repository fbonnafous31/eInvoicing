import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/layout/NavBar';
import routes from './AppRoutes';

// Layout centralisé inline
function Layout({ children, fluid = false }) {
  return (
    <>
      <NavBar />
      <main className={fluid ? "container-fluid mt-4 px-0" : "container mt-4"}>
        {children}
      </main>
    </>
  );
}

// Invoices
import InvoicesList from './pages/invoices/InvoicesList';

function App() {
  return (
    <Router>
      <Routes>
        {routes.map(({ path, element }) => {
          // On détecte si le composant doit être full width
          const isFullWidth =
            element.type.name === "InvoiceView" ||
            element.type.name === "ClientsList" ||
            element.type.name === "SellersList" ||
            element.type.name === "InvoicesList";

<<<<<<< HEAD
          return (
            <Route
              key={path}
              path={path}
              element={<Layout fluid={isFullWidth}>{element}</Layout>}
            />
          );
        })}
=======
        {/* Clients */}
        <Route path="/clients" element={<ClientsList />} />
        <Route path="/clients/new" element={<NewClient />} />
        <Route path="/clients/:id" element={<ClientDetail />} />

        {/* Invoices */}
        <Route path="/invoices" element={<InvoicesList />} />
>>>>>>> 5f08e77 (Jour 13 : liste des factures frontend, helpers et tooltips, stratégie de travail avec ChatGPT)
      </Routes>
    </Router>
  );
}

export default App;
