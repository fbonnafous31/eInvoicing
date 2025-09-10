import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerService } from "@/services/sellers";

export default function Home() {
  const navigate = useNavigate();
  const { fetchMySeller } = useSellerService();
  const [loading, setLoading] = useState(true);
  const [hasSeller, setHasSeller] = useState(false);

  useEffect(() => {
    const checkSeller = async () => {
      try {
        const seller = await fetchMySeller();
        setHasSeller(!!seller);
      } catch {
        setHasSeller(false);
      } finally {
        setLoading(false);
      }
    };
    checkSeller();
  }, [fetchMySeller]);

  if (loading) return <p>Chargement…</p>;

  if (!hasSeller) {
    return (
      <div className="container mt-5">
        <div className="card p-4 text-center shadow">
          <h2>Bienvenue sur eInvoicing !</h2>
          <p>Avant de commencer, créez votre fiche vendeur pour gérer vos factures.</p>
            <button 
              className="btn btn-primary btn-lg px-4 mt-3 d-block mx-auto"
              onClick={() => navigate("/sellers/new")}
            >
              Créer ma fiche vendeur
            </button>
        </div>
      </div>
    );
  }

  // Si fiche existante, affichage du dashboard
  return (
    <div className="container mt-4">
      <h1>Bonjour !</h1>
      <p>Voici votre dashboard…</p>
      {/* ici tu peux mettre les composants du dashboard */}
    </div>
  );
}
