// frontend/src/components/invoices/InvoiceTabs.jsx
import { useState } from "react";
import PdfViewer from "./PdfViewer";

const InvoiceTabs = ({ attachments, backendUrl }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!attachments || !attachments.length) return <div>Aucun PDF disponible</div>;

  const handleTabClick = (index) => setActiveIndex(index);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      
      {/* Onglets */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid #ccc",
        marginBottom: "10px",
        overflowX: "auto"
      }}>
        {attachments.map((att, idx) => (
          <button
            key={att.id}
            onClick={() => handleTabClick(idx)}
            style={{
              padding: "10px 20px",
              border: "none",
              borderBottom: idx === activeIndex ? "3px solid #007bff" : "3px solid transparent",
              background: "transparent",
              cursor: "pointer",
              fontWeight: idx === activeIndex ? "600" : "400",
              whiteSpace: "nowrap",
            }}
          >
            {att.file_name}
          </button>
        ))}
      </div>

      {/* PDF */}
      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", borderRadius: "4px" }}>
        <PdfViewer fileUrl={`${backendUrl}/uploads/invoices/${attachments[activeIndex].stored_name}`} />
      </div>
    </div>
  );
};

export default InvoiceTabs;
