import React, { useState, useEffect, useCallback } from "react";
import { FR } from "../../constants/translations";

export default function TechnicalStatusCell({ row, invoiceService }) {
  const [status, setStatus] = useState(row.technical_status || "PENDING");

  const statusKey = status.toLowerCase();
  const label = FR.technicalStatus[statusKey] || statusKey;

  // Couleur du badge selon le statut
  let color = "gray";
  if (statusKey === "received") color = "green";
  else if (statusKey === "validated") color = "blue";
  else if (statusKey === "rejected") color = "red";
  else if (statusKey === "error") color = "darkred";

  // Memoize la fonction de polling pour que React ne la recrée pas à chaque render
  const pollStatus = useCallback(async () => {
    if (!row.submissionId) return;

    try {
      const pdpStatus = await invoiceService.pollInvoiceStatusPDP(
        row.submissionId,
        2000,   // interval
        20000   // timeout
      );

      if (pdpStatus && pdpStatus.technicalStatus) {
        setStatus(pdpStatus.technicalStatus);
      }
    } catch (err) {
      console.error("Erreur polling PDP:", err);
    }
  }, [row.submissionId, invoiceService]);

  // Polling automatique
  useEffect(() => {
    if (!row.submissionId) return;
    if (["validated", "rejected"].includes(statusKey)) return;

    let isMounted = true;

    const intervalTime = 2000;

    const timer = setInterval(async () => {
      if (!isMounted) return;

      await pollStatus();

      // Si statut final, stop le polling
      if (["validated", "rejected"].includes(status.toLowerCase())) {
        clearInterval(timer);
      }
    }, intervalTime);

    // Poll une première fois immédiatement
    pollStatus();

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [pollStatus, statusKey, status, row.submissionId]); 

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
        {label}
      </span>
    </div>
  );
}
