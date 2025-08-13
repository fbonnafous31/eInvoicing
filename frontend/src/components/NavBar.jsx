import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function NavBar() {
  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">eInvoicing</Link>
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

        <div className="collapse navbar-collapse" id="navbarNavDropdown">
          <ul className="navbar-nav">

            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: 'pointer' }}
              >
                Vendeurs
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/sellers">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/sellers/new">Créer</NavLink></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: 'pointer' }}
              >
                Clients
              </span>
              <ul className="dropdown-menu">
                <li><NavLink className="dropdown-item" to="/clients">Liste</NavLink></li>
                <li><NavLink className="dropdown-item" to="/clients/new">Créer</NavLink></li>
              </ul>
            </li>

            <li className="nav-item dropdown">
              <span
                className="nav-link dropdown-toggle"
                role="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
                style={{ cursor: 'pointer' }}
              >
                Factures
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
