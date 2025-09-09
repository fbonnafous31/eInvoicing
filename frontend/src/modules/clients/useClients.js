import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useClientService } from '@/services/clients';

export default function useClients() {
  const { fetchClients } = useClientService();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getToken } = useAuth(); // récupère le JWT

  useEffect(() => {
    let isMounted = true; // empêche le setState après démontage

    const loadClients = async () => {
      try {
        const token = await getToken({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
        });
        console.log("Token JWT obtenu :", token);

        const data = await fetchClients(token);
        if (isMounted) setClients(data);
      } catch (err) {
        console.error(err);
        if (isMounted) setError("Erreur 403 lors du chargement des clients");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadClients();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { clients, loading, error };
}
