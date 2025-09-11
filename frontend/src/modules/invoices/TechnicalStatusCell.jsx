import React, { useEffect } from "react";
import { FR } from "../../constants/translations";

export default function TechnicalStatusCell({ row, invoiceService, onTechnicalStatusChange }) {
  const status = row.technical_status || "PENDING";
  const statusKey = status.toLowerCase();
  const label = FR.technicalStatus[statusKey] || statusKey;

  let color = "gray";
  if (statusKey === "received") color = "green";
  else if (statusKey === "validated") color = "blue";
  else if (statusKey === "rejected") color = "red";
  else if (statusKey === "error") color = "darkred";

  useEffect(() => {
    if (!row.submissionId) return;
    if (["validated", "rejected"].includes(statusKey)) return;

    let isMounted = true;
    const intervalTime = 2000;

    const timer = setInterval(async () => {
      if (!isMounted) return;

      try {
        const pdpStatus = await invoiceService.pollInvoiceStatusPDP(
          row.submissionId,
          intervalTime,
          20000
        );

        if (pdpStatus?.technicalStatus) {
          onTechnicalStatusChange?.(row.id, pdpStatus.technicalStatus);

          if (["validated", "rejected"].includes(pdpStatus.technicalStatus.toLowerCase())) {
            clearInterval(timer);
          }
        }
      } catch (err) {
        console.error("Erreur polling PDP:", err);
        clearInterval(timer);
      }
    }, intervalTime);

    // Première vérification immédiate
    (async () => {
      try {
        const pdpStatus = await invoiceService.pollInvoiceStatusPDP(
          row.submissionId,
          intervalTime,
          20000
        );
        if (pdpStatus?.technicalStatus) {
          onTechnicalStatusChange?.(row.id, pdpStatus.technicalStatus);
        }
      } catch (err) {
        console.error("Erreur polling PDP initial :", err);
      }
    })();

    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [row.submissionId, statusKey, invoiceService, onTechnicalStatusChange, row.id]);

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
