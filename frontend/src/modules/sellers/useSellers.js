// frontend/src/modules/sellers/useSellers.js
import { useState, useEffect } from 'react';
import { useSellerService } from '@/services/sellers';

export default function useSellers() {
  const { fetchSellers } = useSellerService();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadSellers = async () => {
      try {
        const data = await fetchSellers();
        if (isMounted) setSellers(data);
      } catch (err) {
        console.error(err);
        if (isMounted) setError('Erreur lors du chargement des vendeurs');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadSellers();

    return () => {
      isMounted = false;
    };
  }, [fetchSellers]);

  return { sellers, setSellers, loading, error };
}
