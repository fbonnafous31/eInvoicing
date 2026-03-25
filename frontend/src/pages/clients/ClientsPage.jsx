import React, { useEffect, useState } from 'react';
import { useClientService } from '@/services/clients';
import ClientsList from './ClientsList';
import ClientForm from './ClientForm';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const clientService = useClientService();

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      try {
        const data = await clientService.fetchClients();
        if (isMounted) setClients(data);
      } catch (err) {
        console.error("Erreur chargement clients :", err);
      }
    };

    loadClients();

    return () => { isMounted = false; };
  }, [clientService]);

  // Après création client
  const handleClientCreated = (newClient) => {
    setClients(prev => [newClient, ...prev]);
  };

  return (
    <div>
      <ClientForm onSubmit={handleClientCreated} />
      <ClientsList clients={clients} />
    </div>
  );
}
