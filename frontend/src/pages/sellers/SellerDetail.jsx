// frontend/src/pages/sellers/SellerDetail.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import SellerForm from "./SellerForm";
import Breadcrumb from "../../components/layout/Breadcrumb";
import { EditButton, CancelButton } from "@/components/ui/buttons";
import { useSellerService } from "@/services/sellers";

export default function SellerDetail({ sellerId: propSellerId }) {
  const { id: paramId } = useParams();
  const id = propSellerId || paramId;
  console.log("[SellerDetail] rendu avec id =", id);

  const [seller, setSeller] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const { fetchSeller, updateSeller } = useSellerService();

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const loadSeller = async () => {
      try {
        const data = await fetchSeller(id);
        if (!data.contact_email) data.contact_email = "";
        if (isMounted) setSeller(data);
      } catch (err) {
        console.error(err);
        if (isMounted) setErrorMessage("Erreur lors du chargement du vendeur");
      }
    };

    loadSeller();

    return () => {
      isMounted = false;
    };
  }, [id, fetchSeller]);

  const handleUpdate = async (updatedData) => {
    if (!updatedData.contact_email) updatedData.contact_email = "";

    try {
      const data = await updateSeller(id, updatedData);
      if (!data.contact_email) data.contact_email = "";
      setSeller(data);
      setIsEditing(false);
      setSuccessMessage("Vendeur mis à jour avec succès ! 🎉");
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccessMessage(""), 2000);
    } catch (err) {
      console.error(err);
      setErrorMessage("Erreur lors de la mise à jour du vendeur");
    }
  };

  if (!seller) return <p>Chargement...</p>;

  const breadcrumbItems = [
    { label: "Accueil", path: "/" },
    { label: propSellerId ? "Profil" : "Vendeurs", path: propSellerId ? "/seller" : "/sellers" },
    { label: seller.legal_name || "Détail", path: propSellerId ? "/seller" : `/sellers/${id}` },
  ];

  return (
    <div className="container mt-4">
      <Breadcrumb items={breadcrumbItems} />

      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <SellerForm
        onSubmit={isEditing ? handleUpdate : undefined}
        disabled={!isEditing}
        initialData={seller}
      />

      <div className="mt-4 mb-5 d-flex justify-content-end gap-2">
        {isEditing ? (
          <CancelButton onClick={() => setIsEditing(false)} />
        ) : (
          <EditButton onClick={() => setIsEditing(true)}>Modifier</EditButton>
        )}
      </div>
    </div>
  );
}
