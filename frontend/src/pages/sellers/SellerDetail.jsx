import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SellerForm from './SellerForm';
import Breadcrumb from '../../components/layout/Breadcrumb';
import { fetchSeller, updateSeller, deleteSeller } from '../../services/sellers';
import { EditButton, CancelButton, DeleteButton } from '@/components/ui/buttons';

export default function SellerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSeller(id)
      .then(data => {
        // S'assurer que contact_email n'est jamais null
        if (!data.contact_email) data.contact_email = '';
        setSeller(data);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage('Erreur lors du chargement du vendeur');
      });
  }, [id]);

  const handleUpdate = (updatedData) => {
    // Forcer contact_email à une chaîne vide si vide
    if (!updatedData.contact_email) updatedData.contact_email = '';

    updateSeller(id, updatedData)
      .then(data => {
        if (!data.contact_email) data.contact_email = '';
        setSeller(data);
        setIsEditing(false);
        setSuccessMessage("Vendeur mis à jour avec succès ! 🎉");
        setTimeout(() => {
          setSuccessMessage('');
          navigate('/sellers');
        }, 2000);
      })
      .catch(err => {
        console.error(err);
        setErrorMessage('Erreur lors de la mise à jour du vendeur');
      });
  };

  const handleDelete = () => {
    if (window.confirm('Voulez-vous vraiment supprimer ce vendeur ?')) {
      deleteSeller(id)
        .then(() => navigate('/sellers'))
        .catch(err => {
          console.error(err);
          setErrorMessage('Erreur lors de la suppression du vendeur');
        });
    }
  };

  if (!seller) return <p>Chargement...</p>;

  const breadcrumbItems = [
    { label: 'Accueil', path: '/' },
    { label: 'Vendeurs', path: '/sellers' },
    { label: seller.legal_name || 'Détail', path: `/sellers/${id}` },
  ];

  return (
    <div className="container mt-4">
      <Breadcrumb items={breadcrumbItems} />

      {successMessage && (
        <div className="alert alert-success" role="alert">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger" role="alert">
          {errorMessage}
        </div>
      )}

      <SellerForm
        onSubmit={isEditing ? handleUpdate : undefined}
        disabled={!isEditing}
        initialData={seller}
      />

      <div className="mt-3 d-flex justify-content-end gap-2">
        {isEditing ? (
          <CancelButton onClick={() => setIsEditing(false)} />
        ) : (
          <EditButton onClick={() => setIsEditing(true)}>
            Modifier
          </EditButton>
        )}
        <DeleteButton onClick={handleDelete} />
      </div>
    </div>
  );
}
