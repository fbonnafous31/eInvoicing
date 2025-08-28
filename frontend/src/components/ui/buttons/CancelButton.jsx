import React from 'react';

export default function CancelButton({ children = 'Annuler', onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`btn btn-secondary ${className}`}
      onClick={onClick}
    >
      ❌ {children}
    </button>
  );
}
