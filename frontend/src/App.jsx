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

// Fonction utilitaire pour récupérer le nom du composant réel
const getComponentName = (element) => {
  // Si l'élément est enveloppé dans un HOC comme RequireSeller
  if (element?.props?.children?.type?.name) {
    return element.props.children.type.name;
  }
  // Sinon on retourne le nom du composant directement
  return element.type.name;
};

function App() {
  const fullWidthStaticRoutes = ["/clients", "/sellers", "/invoices", "/"];

  return (
    <Routes>
      {/* Page publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Routes protégées */}
      {routes.map(({ path, element }) => {
        if (path === "/login") return null;

        let isFullWidth = false;

        // Routes statiques
        if (fullWidthStaticRoutes.includes(path)) {
          isFullWidth = true;
        }

        // Routes dynamiques ciblées
        if (path === "/invoices/:id/view") {
          isFullWidth = true;
        }

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
