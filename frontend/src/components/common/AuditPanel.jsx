// frontend/src/components/common/AuditPanel.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function AuditPanel({ createdAt, updatedAt }) {
  // Conversion sécurisée des dates
  const created = createdAt && !isNaN(Date.parse(createdAt)) ? new Date(createdAt) : null;
  const updated = updatedAt && !isNaN(Date.parse(updatedAt)) ? new Date(updatedAt) : null;

  return (
    <div className="p-2 bg-light border rounded">
      <p className="mb-1 text-muted small">
        Créé le {created ? created.toLocaleDateString() : '—'} à {created ? created.toLocaleTimeString() : '—'}
      </p>

      <p className="mb-0 text-muted small">
        Mis à jour le {updated ? updated.toLocaleDateString() : '—'} à {updated ? updated.toLocaleTimeString() : '—'}
      </p>
    </div>
  );
}

AuditPanel.propTypes = {
  createdAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  updatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
};

