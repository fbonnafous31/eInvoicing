// frontend/src/pages/Home.jsx
import React from 'react';
import { useAuth0 } from "@auth0/auth0-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth0();
  if (!isAuthenticated) {
    return <p>Chargement...</p>;
  }

  console.log("Utilisateur connecté :", user);
  // Données factices
  const totalRevenue = 12500; // €  
  const recentInvoices = [
    { id: 101, client: 'Acme Corp', total: 1250, status: 'Payée' },
    { id: 102, client: 'Beta Ltd', total: 980, status: 'En attente' },
    { id: 103, client: 'Gamma SA', total: 2430, status: 'Payée' },
  ];

  const upcomingPayments = [
    { id: 201, client: 'Delta Inc', due: '2025-09-15', amount: 1100 },
    { id: 202, client: 'Epsilon LLC', due: '2025-09-20', amount: 560 },
  ];

  const notifications = [
    { id: 301, message: 'Facture #102 en attente depuis 3 jours', type: 'warning' },
    { id: 302, message: 'Nouvelle demande de contact client "Zeta Co"', type: 'info' },
  ];

  // Helper pour formatter le montant
  const formatEuro = (value) => value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });

  return (
    <div className="container p-3">
      <h1 className="mb-4">Bienvenue sur eInvoicing 🚀</h1>
      <p>Voici un aperçu de vos factures, paiements et notifications.</p>

      {/* Chiffre d'affaires total */}
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card text-white bg-primary">
            <div className="card-body">
              <h5 className="card-title">Chiffre d’affaires total</h5>
              <p className="card-text display-6">{formatEuro(totalRevenue)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        {/* Factures récentes */}
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Factures récentes</h5>
              <ul className="list-group list-group-flush">
                {recentInvoices.map(invoice => (
                  <li key={invoice.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {invoice.client}
                    <span>
                      {formatEuro(invoice.total)} - <strong>{invoice.status}</strong>
                    </span>
                  </li>
                ))}
              </ul>
              <a href="#" className="btn btn-primary mt-3">Voir toutes les factures</a>
            </div>
          </div>
        </div>

        {/* Paiements à venir */}
        <div className="col-md-6 mb-3">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Paiements à venir</h5>
              <ul className="list-group list-group-flush">
                {upcomingPayments.map(payment => (
                  <li key={payment.id} className="list-group-item d-flex justify-content-between align-items-center">
                    {payment.client}
                    <span>
                      {formatEuro(payment.amount)} - {payment.due}
                    </span>
                  </li>
                ))}
              </ul>
              <a href="#" className="btn btn-primary mt-3">Voir tous les paiements</a>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="row mt-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Notifications</h5>
              <ul className="list-group list-group-flush">
                {notifications.map(note => (
                  <li
                    key={note.id}
                    className={`list-group-item ${note.type === 'warning' ? 'list-group-item-warning' : 'list-group-item-info'}`}
                  >
                    {note.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
