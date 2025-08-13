import React, { useState, useEffect } from 'react';
import ClientsList from '../modules/clients/ClientsList';
import ClientForm from '../modules/clients/ClientForm';

export default function ClientsPage() {
  const [clients, setCients] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/clients')
      .then(res => res.json())
      .then(data => setCients(data));
  }, []);

  function handleClientCreated(newClient) {
    setCients(prev => [newClient, ...prev]);
  }

  return (
    <div>
      <ClientForm onClientCreated={handleClientCreated} />
      <ClientsList clients={clients} />
    </div>
  );
}

