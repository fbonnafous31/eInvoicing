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
  return (
    <Routes>
      {/* Page publique */}
      <Route path="/login" element={<LoginPage />} />

      {/* Toutes les autres routes protégées */}
      {routes.map(({ path, element }) => {
        if (path === "/login") return null;

        const componentName = getComponentName(element);
        const isFullWidth = [
          "InvoiceView",
          "ClientsList",
          "SellersList",
          "InvoicesList",
        ].includes(componentName);

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
