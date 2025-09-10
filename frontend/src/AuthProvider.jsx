// frontend/src/AuthProvider.jsx
import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || "/");
  };

  return (
    <Auth0Provider
      domain={import.meta.env.VITE_AUTH0_DOMAIN}
      clientId={import.meta.env.VITE_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="memory"     
      useRefreshTokens={false}   
    >
      {children}
    </Auth0Provider>
  );
};

export default AuthProvider;
