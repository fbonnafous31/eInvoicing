import React, { useState, useEffect } from 'react';
import SellersList from '../modules/sellers/SellersList';
import SellerForm from '../modules/sellers/SellerForm';

export default function SellersPage() {
  const [sellers, setSellers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3000/api/sellers')
      .then(res => res.json())
      .then(data => setSellers(data));
  }, []);

  function handleSellerCreated(newSeller) {
    setSellers(prev => [newSeller, ...prev]);
  }

  return (
    <div>
      <SellerForm onSellerCreated={handleSellerCreated} />
      <SellersList sellers={sellers} />
    </div>
  );
}

