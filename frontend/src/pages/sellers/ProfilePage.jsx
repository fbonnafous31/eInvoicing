// frontend/src/pages/sellers/ProfilePage.jsx
import React, { useEffect, useState } from "react";
import SellerDetail from "./SellerDetail";
import { useSellerService } from "@/services/sellers";

export default function ProfilePage() {
  const [sellerId, setSellerId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { fetchMySeller } = useSellerService();

  useEffect(() => {
    let isMounted = true;

    const loadSeller = async () => {
      console.log("[ProfilePage] → Début loadSeller", { loading, sellerId, error });
      try {
        const seller = await fetchMySeller();
        console.log("[ProfilePage] ← seller reçu :", seller);

        if (!seller || !seller.id) {
          console.warn("[ProfilePage] Seller invalide :", seller);
          if (isMounted) setError("Profil invalide ou incomplet");
          return;
        }

        if (isMounted) {
          console.log("[ProfilePage] Mise à jour du sellerId :", seller.id);
          setSellerId(seller.id);
        }
      } catch (err) {
        console.error("[ProfilePage] Erreur fetchMySeller :", err);
        if (isMounted) setError(err.message || "Impossible de récupérer le profil");
      } finally {
        if (isMounted) {
          console.log("[ProfilePage] ← loadSeller terminé, loading → false");
          setLoading(false);
        }
      }
    };

    loadSeller();

    return () => { 
      console.log("[ProfilePage] → Composant démonté, isMounted = false");
      isMounted = false; 
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMySeller]);

  console.log("[ProfilePage] Rendu avec state :", { loading, error, sellerId });

  if (loading) return <p>Chargement...</p>;
  if (error) return <p className="text-danger">{error}</p>;
  if (!sellerId) return <p>Aucun profil trouvé</p>;

  // On réutilise SellerDetail en injectant l'id
  return <SellerDetail sellerId={sellerId} />;
}
