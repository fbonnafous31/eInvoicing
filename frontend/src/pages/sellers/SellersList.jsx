import React, { useEffect, useState } from 'react';

export default function SellersList() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/sellers')
      .then(res => res.json())
      .then(data => {
        setSellers(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Liste des vendeurs</h1>
      <ul>
        {sellers.map(seller => (
          <li key={seller.id}>
            {seller.legal_name} - {seller.city}
          </li>
        ))}
      </ul>
    </div>
  );
}
