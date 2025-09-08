// frontend/src/pages/LoginPage.jsx
import React from "react";
import { LoginButton } from "./components/auth/LoginButton.jsx";
import './LoginPage.css';

const LoginPage = () => (
  <div className="login-page d-flex justify-content-center align-items-center vh-100">
    <div className="card shadow p-4 text-center login-card">
      <h1 className="mb-3 fw-bold">eInvoicing</h1>
      <p className="mb-4 text-muted">Connectez-vous pour accéder à l'application</p>
      <LoginButton className="btn-lg btn-primary w-100" />
    </div>
  </div>
);

export default LoginPage;
