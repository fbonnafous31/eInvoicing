import { useState, useEffect } from 'react';
import { fetchSellers } from '../../services/sellers';

export default function useSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSellers()
      .then(data => setSellers(data))
      .catch(err => {
        console.error(err);
        setError('Erreur lors du chargement des vendeurs');
      })
      .finally(() => setLoading(false));
  }, []);

  return { sellers, setSellers, loading, error };
}
