import React from "react";
import { Auth0Provider } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { getEnv } from "./utils/getEnv";

const AuthProvider = ({ children }) => {
  const navigate = useNavigate();

  const onRedirectCallback = (appState) => {
    navigate(appState?.returnTo || "/");
  };

  const env = getEnv();
  const domain = env.VITE_AUTH0_DOMAIN;
  const clientId = env.VITE_AUTH0_CLIENT_ID;
  const audience = env.VITE_AUTH0_AUDIENCE;

  if (!domain || !clientId || !audience) {
    return null; 
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
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
