import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerService } from "../../services/sellers";

export default function RequireNoSeller({ children }) {
  const { fetchMySeller } = useSellerService();
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSeller = async () => {
      try {
        const seller = await fetchMySeller();
        if (seller) {
          // Si vendeur déjà existant → redirection vers le profil
          navigate("/seller", { replace: true });
        } else {
          setLoading(false); // pas de vendeur → affichage du formulaire
        }
      } catch (err) {
        // 404 signifie pas de vendeur → on peut créer
        if (err.message.includes("404")) {
          setLoading(false);
        } else {
          console.error(err);
        }
      }
    };
    checkSeller();
  }, [fetchMySeller, navigate]);

  if (loading) return <p>Chargement…</p>;
  return children;
}
