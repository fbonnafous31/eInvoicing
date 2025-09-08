// frontend/src/components/layout/NavBar.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { FaUserTie, FaUsers, FaFileInvoice } from 'react-icons/fa';
import { useAuth0 } from '@auth0/auth0-react';
import './NavBar.css';

export default function NavBar() {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom shadow-sm">
      <div className="container-fluid">
        {/* Marque */}
        <Link className="navbar-brand fw-semibold" to="/">eInvoicing</Link>

        {/* Toggle mobile */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNavDropdown"
          aria-controls="navbarNavDropdown"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu */}
        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav me-auto">
            {/* Vendeurs */}
            <li className="nav-item dropdown">
              <span className="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <FaUserTie className="nav-icon" /> Vendeurs
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/sellers">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/sellers/new">Créer</NavLink></li>
              </ul>
            </li>

            {/* Clients */}
            <li className="nav-item dropdown">
              <span className="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <FaUsers className="nav-icon" /> Clients
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/clients">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/clients/new">Créer</NavLink></li>
              </ul>
            </li>

            {/* Factures */}
            <li className="nav-item dropdown">
              <span className="nav-link dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                <FaFileInvoice className="nav-icon" /> Factures
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/invoices">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/invoices/new">Créer</NavLink></li>
              </ul>
            </li>
          </ul>

          {/* Login / Logout */}
          <ul className="navbar-nav ms-auto">
            {isAuthenticated ? (
              <>
                <li className="nav-item d-flex align-items-center me-3 text-white">
                  {user?.name || user?.email}
                </li>
                <li className="nav-item">
                  <button
                    className="btn btn-outline-light"
                    onClick={() =>
                      logout({ returnTo: window.location.origin + "/login" })
                    }
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <button
                  className="btn btn-outline-light"
                  onClick={() => loginWithRedirect()}
                >
                  Login
                </button>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
