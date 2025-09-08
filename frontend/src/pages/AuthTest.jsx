import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { LoginButton } from "../components/auth/LoginButton";
import { LogoutButton } from "../components/auth/LogoutButton";

const AuthTest = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Test Auth0</h1>
      {isAuthenticated ? (
        <div>
          <p>Bienvenue, {user.name} ({user.email})</p>
          <LogoutButton />
        </div>
      ) : (
        <LoginButton />
      )}
    </div>
  );
};

export default AuthTest;
