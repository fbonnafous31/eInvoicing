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
  credit: {
    label: "Avoir",
    background: "#f8d7da",
    color: "#721c24",
  }
};

export default function InvoiceTypeTag({ type }) {
  const config = styles[type] || styles.standard;

  return (
    <span
      style={{
        display: "inline-block",
        width: "80px",          
        textAlign: "center",    
        padding: "3px 0",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        background: config.background,
        color: config.color,
      }}
    >
      {config.label}
    </span>
  );
}