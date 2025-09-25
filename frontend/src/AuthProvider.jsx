// frontend/src/AuthProvider.jsx
import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || "/");
  };

  // Récupère les variables selon l'environnement
  const env = import.meta.env.DEV
    ? import.meta.env            // dev → .env Vite
    : window.__ENV__ || {};      // prod → config.js injecté par Nginx

  const domain = env.VITE_AUTH0_DOMAIN;
  const clientId = env.VITE_AUTH0_CLIENT_ID;
  const audience = env.VITE_AUTH0_AUDIENCE;

  if (!domain || !clientId) {
    console.error("Auth0 variables are missing!", env);
    return null; // stoppe le rendu si les variables manquent
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="memory"
      useRefreshTokens={false}
      audience={audience}
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider;
