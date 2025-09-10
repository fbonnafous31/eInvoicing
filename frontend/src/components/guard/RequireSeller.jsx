// frontend/src/components/guards/RequireSeller.jsx
import { useEffect, useState } from "react";
import { useSellerService } from "@/services/sellers";
import { useNavigate } from "react-router-dom";

export default function RequireSeller({ children }) {
  const { fetchMySeller } = useSellerService();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSeller = async () => {
      try {
        const seller = await fetchMySeller();
        if (!seller) {
          // Pas de fiche vendeur → redirection vers création
          navigate("/sellers/new");
        }
      } catch (err) {
        console.error("Erreur fetchMySeller:", err);
        // Optionnel : afficher message ou rediriger
        navigate("/sellers/new");
      } finally {
        setLoading(false);
      }
    };
    checkSeller();
  }, [fetchMySeller, navigate]);

  if (loading) return <p>Chargement du profil vendeur…</p>;
  return children;
}
