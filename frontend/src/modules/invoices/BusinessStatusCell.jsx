import React, { useState, useEffect } from "react";
import { BUSINESS_STATUSES } from '../../constants/businessStatuses';

export default function BusinessStatusCell({ row, getStatusComment }) {
  const [status, setStatus] = useState({
    code: row.business_status || 100,
    label: BUSINESS_STATUSES[row.business_status || 100]?.label || 'Non renseigné',
  });

  const [comment, setComment] = useState(null);

  // Sync status si row.business_status change
  useEffect(() => {
    setStatus({
      code: row.business_status || 100,
      label: BUSINESS_STATUSES[row.business_status || 100]?.label || 'Non renseigné',
    });

    // On récupère le commentaire si la fonction est passée
    if (getStatusComment) {
      getStatusComment().then(c => setComment(c));
    }
  }, [row.business_status, getStatusComment]);

  const bgColor = BUSINESS_STATUSES[status.code]?.color || 'gray';

  return (
    <div style={{ textAlign: "center" }}>
      <span
        style={{
          display: "inline-block",
          padding: "2px 6px",
          borderRadius: "4px",
          backgroundColor: bgColor,
          color: 'white',
          fontWeight: 500,
          fontSize: "0.85em",
          cursor: row.submission_id ? 'pointer' : 'default',
        }}
        title={comment || status.label} // affiche le commentaire si existant
      >
        {status.label}
      </span>
    </div>
  );
}
