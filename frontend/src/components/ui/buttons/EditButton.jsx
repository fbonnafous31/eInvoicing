// frontend/src/components/ui/buttons/EditButton.jsx
import React from 'react';

export default function EditButton({ children = 'Modifier', onClick, className = '' }) {
  return (
    <button
      type="button"
      className={`btn btn-primary ${className}`}
      onClick={onClick}
    >
      ✏️ {children}
    </button>
  );
}
