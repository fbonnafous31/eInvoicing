// frontend/src/components/common/SellerAuditPanel.jsx
import React from 'react';

export default function SellerAuditPanel({ createdAt, updatedAt }) {
  return (
    <div className="p-2 bg-light border rounded">
      <p className="mb-1">
        <span className="text-muted small">
          Créé le {createdAt ? new Date(createdAt).toLocaleDateString() : '—'}
        </span>
      </p>
      <p className="mb-0">
        <span className="text-muted small">
          Mis à jour le {updatedAt ? new Date(updatedAt).toLocaleDateString() : '—'}
        </span>
      </p>
    </div>
  );
}
