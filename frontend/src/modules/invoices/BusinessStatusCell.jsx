// BusinessStatusCell.jsx
import React, { useState } from "react";
import { BUSINESS_STATUSES } from '../../constants/businessStatuses';

export default function BusinessStatusCell({ row, invoiceService, onBusinessStatusChange }) {
  const [status, setStatus] = useState({
    code: row.business_status || 100,
    label: BUSINESS_STATUSES[row.business_status || 100]?.label || 'Non renseigné',
  });

  const fetchLatestStatus = async () => {
    try {
      const data = await invoiceService.getInvoiceLifecycle(row.id);
      const lifecycle = Array.isArray(data.lifecycle) ? data.lifecycle : [];
      if (!lifecycle.length) return null;

      const lastStatusRaw = lifecycle[lifecycle.length - 1];
      return {
        status_code: lastStatusRaw.code,
        status_label: lastStatusRaw.label,
      };
    } catch (err) {
      console.warn(`[BusinessStatusCell] Erreur fetch statut pour invoice ${row.id}:`, err.message);
      return null;
    }
  };

  const refreshStatus = async () => {
    if (!row.submission_id) {
      console.log(`[BusinessStatusCell] Pas de submission_id pour invoice ${row.id}, pas de rafraîchissement`);
      return;
    }

    console.log(`[BusinessStatusCell] Rafraîchissement statut pour invoice ${row.id}...`);
    const lastStatus = await fetchLatestStatus();
    if (!lastStatus) return;

    console.log(`[BusinessStatusCell] Nouveau statut pour invoice ${row.id}: ${lastStatus.status_label}`);
    setStatus({
      code: lastStatus.status_code,
      label: lastStatus.status_label,
    });

    onBusinessStatusChange?.(row.id, lastStatus.status_code, lastStatus.status_label);
  };

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
        onClick={refreshStatus}
        title={row.submission_id ? 'Cliquer pour rafraîchir le statut' : 'Aucun statut à rafraîchir'}
      >
        {status.label}
      </span>
    </div>
  );
}
