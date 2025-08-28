// frontend/src/components/ui/buttons/SmallDeleteButton.jsx
import React from 'react';

export default function SmallDeleteButton({ onClick, disabled = false, title = 'Supprimer' }) {
  return (
    <button
      type="button"
      className="btn btn-sm btn-danger p-1" // btn-sm pour réduire la taille + padding
      onClick={onClick}
      disabled={disabled}
      title={title} // info-bulle au survol
    >
      🗑️
    </button>
  );
}
