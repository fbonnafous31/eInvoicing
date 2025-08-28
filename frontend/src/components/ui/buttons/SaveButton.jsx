// frontend/src/components/ui/buttons/SaveButton.jsx
import React from 'react';

export default function SaveButton({ children = 'Enregistrer', className = '' }) {
  return (
    <button
      type="submit"
      className={`btn btn-primary ${className}`}
    >
      💾 {children}
    </button>
  );
}
