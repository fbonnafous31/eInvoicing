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

          return (
            <Route
              key={path}
              path={path}
              element={<Layout fluid={isFullWidth}>{element}</Layout>}
            />
          );
        })}
      </Routes>
    </Router>
  );
}

export default App;
