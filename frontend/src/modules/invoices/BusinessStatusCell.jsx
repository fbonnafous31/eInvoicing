import React, { useEffect } from "react";

const BUSINESS_STATUSES = {
  201: { label: 'Émise par la plateforme', color: 'green' },
  202: { label: 'Reçue par la plateforme', color: 'blue' },
  203: { label: 'Mise à disposition', color: 'teal' },
  204: { label: 'Prise en charge', color: 'purple' },
  205: { label: 'Approuvée', color: 'green' },
  206: { label: 'Approuvée partiellement', color: 'yellow' },
  207: { label: 'En litige', color: 'orange' },
  208: { label: 'Suspendue', color: 'gray' },
  210: { label: 'Refusée', color: 'red' },
  211: { label: 'Paiement transmis', color: 'blue' },
  100: { label: 'En attente', color: 'gray' }, // statut par défaut
};

export default function BusinessStatusCell({ row, invoiceService, onBusinessStatusChange }) {
  const lastLifecycle = Array.isArray(row.lifecycle) && row.lifecycle.length > 0
    ? row.lifecycle[row.lifecycle.length - 1]
    : null;

  const statusCode = lastLifecycle?.code || row.business_status || 100;
  const statusLabel = lastLifecycle?.label || row.business_status_label || BUSINESS_STATUSES[statusCode]?.label || 'Inconnu';
  const color = BUSINESS_STATUSES[statusCode]?.color || 'gray';

  useEffect(() => {
    // Ne poller que si statut non final
    if ([201, 210].includes(statusCode)) return;

    let isMounted = true;
    const intervalTime = 2000;

    const timer = setInterval(async () => {
      if (!isMounted) return;

      try {
        const lastStatus = await invoiceService.pollInvoiceLifecycle(
          row.id,
          intervalTime,
          20000
        );

        if (lastStatus?.status_code) {
          onBusinessStatusChange?.(row.id, lastStatus.status_code, lastStatus.status_label);

          // Stop polling si statut final
          if ([201, 210].includes(lastStatus.status_code)) {
            clearInterval(timer);
          }
        }
      } catch (err) {
        console.error("Erreur polling cycle métier:", err);
        clearInterval(timer);
      }
    }, intervalTime);

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [statusCode, row.id, invoiceService, onBusinessStatusChange]);

  return (
    <div style={{ textAlign: "center" }}>
      <span
        style={{
          display: "inline-block",
          padding: "2px 6px",
          borderRadius: "4px",
          backgroundColor: color,
          color: "white",
          fontWeight: 500,
          fontSize: "0.85em",
        }}
      >
        {statusLabel}
      </span>
    </div>
  );
}
