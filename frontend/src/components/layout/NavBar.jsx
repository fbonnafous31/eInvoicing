// frontend/src/components/layout/NavBar.jsx
import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import './NavBar.css';

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-custom shadow-sm">
      <div className="container-fluid">
        {/* Marque */}
        <Link className="navbar-brand fw-bold" to="/">eInvoicing</Link>

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
          <ul className="navbar-nav">

            {/* Vendeurs */}
            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: 'pointer' }}
              >
                👔 Vendeurs
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/sellers">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/sellers/new">Créer</NavLink></li>
              </ul>
            </li>

            {/* Clients */}
            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: 'pointer' }}
              >
                🧑‍🤝‍🧑 Clients
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/clients">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/clients/new">Créer</NavLink></li>
              </ul>
            </li>

            {/* Factures */}
            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: 'pointer' }}
              >
                🗂️ Factures
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/invoices">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/invoices/new">Créer</NavLink></li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
