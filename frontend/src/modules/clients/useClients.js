// frontend/src/modules/clients/useClients.js
import { useState, useEffect } from "react";
import { fetchClients } from "../../services/clients";
import { useAuth } from "../../hooks/useAuth"; // hook pour récupérer getToken

export default function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getToken } = useAuth(); // récupère le JWT

  useEffect(() => {
    const loadClients = async () => {
      try {
        // 🔑 On demande explicitement l'audience 
        const token = await getToken({
          audience: import.meta.env.VITE_AUTH0_AUDIENCE
        });
        console.log("Token JWT obtenu :", token); 

        const data = await fetchClients(token);
        setClients(data);
      } catch (err) {
        console.error(err);
        setError("Erreur 403 lors du chargement des clients");
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, [getToken]);

  return { clients, loading, error };
}
