// frontend/src/pages/NotFound.jsx
import { Navigate, useLocation } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  // Log pour le debug
  console.log(
    `[DEBUG] NotFound triggered. Tentative d'accès à: ${location.pathname}, referrer: ${document.referrer}`
  );

  // Redirection pour l'utilisateur
  return <Navigate to="/" replace />;
}
