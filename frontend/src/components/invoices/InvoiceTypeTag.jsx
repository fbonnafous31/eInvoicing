import React from "react";

const styles = {
  standard: {
    label: "Facture",
    background: "#e9ecef",
    color: "#333",
  },
  deposit: {
    label: "Acompte",
    background: "#fff3cd",
    color: "#856404",
  },
  final: {
    label: "Solde",
    background: "#d4edda",
    color: "#155724",
  },
  credit_note: {
    label: "Avoir",
    background: "#f8d7da",
    color: "#721c24",
  },
  cancelled: {
    label: "⚠️ Annulée",
    background: "#ffe5b4", 
    color: "#b36b00",      
  },
  quote: {
    label: "Devis",
    background: "#cce5ff",
    color: "#004085",
  },
};

export default function InvoiceTypeTag({ type, status }) {
  // Si la facture est annulée, on utilise le style cancelled
  const config = status === "cancelled" ? styles.cancelled : (styles[type] || styles.standard);

  return (
    <span
      style={{
        display: "inline-block",
        minWidth: "80px",
        textAlign: "center",
        padding: "3px 6px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        background: config.background,
        color: config.color,
        whiteSpace: "nowrap", // force à rester sur une ligne
      }}
    >
      {config.label}
    </span>
  );
}