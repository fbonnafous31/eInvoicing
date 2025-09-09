import { useState, useEffect } from "react";
import { useClientService } from '@/services/clients';

export default function useClients() {
  const { fetchClients } = useClientService();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadClients = async () => {
      try {
        const data = await fetchClients(); 
        if (isMounted) setClients(data);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Erreur lors du chargement des clients");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
  }, [fetchClients]);

  return { clients, loading, error };
}
