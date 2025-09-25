import React, { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import './LoginPage.css';

const LoginPage = () => {
  const { loginWithRedirect } = useAuth0();
  const [isSignup, setIsSignup] = useState(false);

  const handleAuth = () => {
    // 🔹 Récupération des variables selon l'environnement
    const env = import.meta.env.DEV
      ? import.meta.env       // dev → .env Vite
      : window.__ENV__ || {};  // prod → config.js injecté par Nginx

    loginWithRedirect({
      screen_hint: isSignup ? "signup" : "login",
      authorizationParams: {
        audience: env.VITE_AUTH0_AUDIENCE, // ← utilise les variables runtime
        scope: "openid profile email",
      },
    });
  };

  return (
    <div className="login-page d-flex justify-content-center align-items-center vh-100">
      <div className="card shadow p-5 text-start login-card">
        
        {/* Logo + Titre */}
        <div className="d-flex align-items-center mb-3 logo-title">
          <img
            src="/logo.png"
            alt="eInvoicing Logo"
            className="logo"
          />
          <h1 className="fw-bold mb-0">eInvoicing</h1>
        </div>

        <p className="text-secondary mb-4 slogan">
          {isSignup 
            ? "Créez votre compte et commencez à gérer vos factures facilement" 
            : "Connectez-vous pour accéder à vos factures et documents"}
        </p>

        <button
          className="btn btn-primary btn-lg w-100 mb-3"
          onClick={handleAuth}
        >
          {isSignup ? "S'inscrire" : "Se connecter"}
        </button>

        <div className="text-muted mt-2" style={{ fontSize: '0.9rem' }}>
          {isSignup ? "Déjà un compte ?" : "Pas encore de compte ?"}{" "}
          <span
            className="text-primary fw-bold"
            style={{ cursor: "pointer" }}
            onClick={() => setIsSignup(!isSignup)}
          >
            {isSignup ? "Se connecter" : "S'inscrire"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
