// frontend/src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

import routes from "./AppRoutes.jsx";
import NavBar from "./components/layout/NavBar.jsx";
import PrivateRoute from "./components/auth/PrivateRoute.jsx";
import LoginPage from "./LoginPage.jsx";

// Layout centralisé
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
    <Routes>
      {/* Page publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Toutes les autres routes protégées */}
      {routes.map(({ path, element }) => {
        // Ne pas protéger la page de login si elle était incluse dans routes
        if (path === "/login") return null;

        const isFullWidth =
          element.type.name === "InvoiceView" ||
          element.type.name === "ClientsList" ||
          element.type.name === "SellersList" ||
          element.type.name === "InvoicesList";

        return (
          <Route
            key={path}
            path={path}
            element={
              <PrivateRoute>
                <Layout fluid={isFullWidth}>{element}</Layout>
              </PrivateRoute>
            }
          />
        );
      })}
    </Routes>
  );
}

export default App;
