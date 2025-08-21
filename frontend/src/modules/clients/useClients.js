import { useState, useEffect } from 'react';
import { fetchClients } from '../../services/clients';

export default function useClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchClients()
      .then(data => {
        setClients(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Impossible de récupérer les clients');
        setLoading(false);
      });
  }, []);

  return { clients, loading, error };
}
