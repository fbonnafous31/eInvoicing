import { useEffect, useState } from "react";
import { useSellerService } from "@/services/sellers";

/**
 * Hook personnalisé pour récupérer les informations du vendeur connecté.
 * Renvoie le plan, l'état d'activation SMTP et l'objet vendeur complet.
 */
export function useSellerInfo() {
  const sellerService = useSellerService();

  const [seller, setSeller] = useState(null);
  const [sellerPlan, setSellerPlan] = useState("essentiel");
  const [sellerActive, setSellerActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSellerInfo = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedSeller = await sellerService.fetchMySeller();
        console.log("Seller raw from service:", fetchedSeller);

        setSeller(fetchedSeller);

        // Plan principal du vendeur
        const plan = fetchedSeller?.plan || "essentiel";
        setSellerPlan(plan);

        // L'active correspond au SMTP actif
        const isActive = fetchedSeller?.smtp?.active === true;
        setSellerActive(isActive);

        console.log("Seller plan:", plan, "Active:", isActive);
      } catch (err) {
        console.error("Impossible de récupérer le vendeur :", err);
        setError(err);
        setSellerPlan("essentiel");
        setSellerActive(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSellerInfo();
  }, [sellerService]);

  return { seller, sellerPlan, sellerActive, isLoading, error };
}
