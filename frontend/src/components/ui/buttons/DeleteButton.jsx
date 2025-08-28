// frontend/src/components/ui/buttons/DeleteButton.jsx
import React from 'react';

export default function DeleteButton({ children = 'Supprimer', onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`btn btn-danger ${className}`}
      onClick={onClick}
    >
      🗑️ {children}
    </button>
  );
}
