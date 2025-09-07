import React, { useEffect } from 'react';
import { SmallDeleteButton } from '@/components/ui/buttons';

export default function SupportingDocs({ data, onChange, disabled, hideLabelsInView }) {

  useEffect(() => {
    console.log("Current attachments array:", data);
  }, [data]);

  const mainAttachment = data.find(a => a.attachment_type === 'main' && !a.generated);
  const additionalAttachments = data.filter(a => a.attachment_type === 'additional');

  const handleMainChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const mainFile = {
      file_name: file.name,
      raw_file: file,
      attachment_type: 'main'
    };

    const newData = [mainFile, ...data.filter(a => a.attachment_type !== 'main' && !a.generated)];
    console.log("Adding main attachment:", mainFile);
    onChange(newData);
  };

  const handleAdditionalChange = (e) => {
    const files = Array.from(e.target.files).map(f => ({
      file_name: f.name,
      raw_file: f,
      attachment_type: 'additional'
    }));

    console.log("Adding additional attachments:", files);
    onChange([...data, ...files]);
  };

  const removeFile = (index, type) => {
    let newData;
    if (type === 'main') {
      newData = data.filter(a => a.attachment_type !== 'main' && !a.generated);
    } else {
      let count = -1;
      newData = data.filter(a => {
        if (a.attachment_type === 'additional') count++;
        return !(type === 'additional' && count === index);
      });
    }
    console.log(`Removing ${type} file at index ${index}`);
    onChange(newData);
  };

  const handleGeneratePdf = async () => {
    if (!mainAttachment) {
      console.warn("❌ Pas de justificatif principal pour générer le PDF");
      return;
    }

    if (!mainAttachment.invoice_id) {
      console.warn("❌ invoiceId manquant !");
      return;
    }

    try {
      console.log("➡️ Génération PDF pour invoice id:", mainAttachment.invoice_id);

      const resGenerate = await fetch(`/api/invoices/${mainAttachment.invoice_id}/generate-pdf`);
      const data = await resGenerate.json();
      console.log("📄 JSON reçu :", data);

      if (!data.path) {
        console.error("❌ Pas de chemin PDF renvoyé");
        return;
      }

      const pdfRes = await fetch(`http://localhost:3000${data.path}`);
      if (!pdfRes.ok) {
        console.error("❌ Impossible de récupérer le PDF");
        return;
      }

      const blob = await pdfRes.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `facture_${mainAttachment.invoice_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      console.log("✅ PDF téléchargé");
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
              <SmallDeleteButton onClick={() => removeFile(0, 'main')} disabled={disabled} />
            )}
          </div>
        )}

        {/* Bouton Générer PDF */}
        {!hideLabelsInView && mainAttachment && (
          <div className="mt-3">
            <button
              type="button" // empêche le submit
              className="btn btn-primary btn-sm"
              disabled={disabled}
              onClick={handleGeneratePdf}
            >
              Générer le PDF
            </button>
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
                <SmallDeleteButton onClick={() => removeFile(index, 'additional')} disabled={disabled} />
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
