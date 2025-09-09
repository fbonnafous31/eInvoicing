// frontend/src/components/invoices/SupportingDocs.jsx
import React, { useEffect } from "react";
import { SmallDeleteButton } from "@/components/ui/buttons";
import { useAuth } from "@/hooks/useAuth";

export default function SupportingDocs({ data, onChange, disabled, hideLabelsInView, invoice }) {
  const { getToken } = useAuth();

  useEffect(() => {
    console.log("📎 SupportingDocs - current attachments:", data);
  }, [data]);

  // ----------------------
  // Gestion justificatif principal
  // ----------------------
  const mainAttachment = data.find(a => a.attachment_type === "main" && !a.generated);
  const additionalAttachments = data.filter(a => a.attachment_type === "additional");

  const handleMainChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const mainFile = {
      file_name: file.name,
      raw_file: file,
      attachment_type: "main",
    };

    const newData = [mainFile, ...data.filter(a => a.attachment_type !== "main" && !a.generated)];
    console.log("📎 Ajout justificatif principal:", mainFile);
    onChange(newData);
  };

  // ----------------------
  // Gestion justificatifs additionnels
  // ----------------------
  const handleAdditionalChange = (e) => {
    const files = Array.from(e.target.files).map(f => ({
      file_name: f.name,
      raw_file: f,
      attachment_type: "additional",
    }));

    console.log("📎 Ajout justificatifs additionnels:", files);
    onChange([...data, ...files]);
  };

  // ----------------------
  // Suppression fichier
  // ----------------------
  const removeFile = (index, type) => {
    let newData;
    if (type === "main") {
      newData = data.filter(a => a.attachment_type !== "main" && !a.generated);
    } else {
      let count = -1;
      newData = data.filter(a => {
        if (a.attachment_type === "additional") count++;
        return !(type === "additional" && count === index);
      });
    }
    console.log(`🗑️ Suppression fichier ${type} index ${index}`);
    onChange(newData);
  };

  // ----------------------
  // Génération PDF backend
  // ----------------------
  const handleGeneratePdf = async () => {
    if (!invoice) return console.error("❌ invoice missing");

    try {
      const token = await getToken({
        audience: import.meta.env.VITE_AUTH0_AUDIENCE,
      });

      console.log("➡️ Génération PDF pour facture:", invoice.id);

      const res = await fetch("/api/invoices/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // ✅ Auth0 JWT
        },
        body: JSON.stringify(invoice),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur génération PDF: ${res.status} - ${errText}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank"); // ouvrir le PDF dans un nouvel onglet

      console.log("✅ PDF généré et ouvert dans un nouvel onglet");
    } catch (err) {
      console.error("❌ Erreur génération PDF :", err);
    }
  };

  return (
    <div className="card p-3 mb-3">
      <h5>Justificatifs</h5>

      {/* Justificatif principal */}
      <div className="mb-3">
        <label>Justificatif principal (format PDF) *</label>

        {!mainAttachment && (
          <div className="mt-3 pb-3">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={disabled}
              onClick={handleGeneratePdf}
            >
              Générer le PDF
            </button>
          </div>
        )}

        {!hideLabelsInView && (
          <input
            type="file"
            onChange={handleMainChange}
            className="form-control"
            disabled={disabled}
          />
        )}

        {mainAttachment && (
          <div className="mt-1 d-flex justify-content-between align-items-center">
            <span>{mainAttachment.file_name}</span>
            {!hideLabelsInView && (
              <SmallDeleteButton onClick={() => removeFile(0, "main")} disabled={disabled} />
            )}
          </div>
        )}
      </div>

      {/* Justificatifs additionnels */}
      <div className="mb-3">
        <label>Justificatifs additionnels</label>
        {!hideLabelsInView && (
          <input
            type="file"
            multiple
            onChange={handleAdditionalChange}
            className="form-control mb-2"
            disabled={disabled}
          />
        )}
        <ul>
          {additionalAttachments.map((file, index) => (
            <li key={index} className="d-flex justify-content-between align-items-center mb-2">
              <span>{file.file_name || "Nom non disponible"}</span>
              {!hideLabelsInView && (
                <SmallDeleteButton onClick={() => removeFile(index, "additional")} disabled={disabled} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
