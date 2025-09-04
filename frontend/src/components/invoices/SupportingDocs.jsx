import React, { useEffect, useState } from 'react';
import { SmallDeleteButton } from '@/components/ui/buttons';

export default function SupportingDocs({ data, onChange, disabled, hideLabelsInView }) {
  const [mode, setMode] = useState(() => {
    const hasGenerated = data.some(a => a.generated);
    return hasGenerated ? "generate" : "upload";
  });

  // Logs pour debug
  useEffect(() => {
    console.log("Current attachments array:", data);
  }, [data]);

  const mainAttachment = data.find(a => a.attachment_type === 'main' && !a.generated);
  const additionalAttachments = data.filter(a => a.attachment_type === 'additional');

  const handleModeChange = (e) => {
    const selected = e.target.value;
    setMode(selected);

    if (selected === "generate") {
      onChange([{ attachment_type: "main", generated: true }]);
    } else {
      // retour au mode upload → on vide les attachments
      onChange([]);
    }
  };

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

  return (
    <div className="card p-3 mb-3">
      <h5>Justificatifs</h5>

      <div className="mb-3">
        <label className="form-label me-3">Mode de justificatif principal :</label>
        <div className="d-inline-flex align-items-center">
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              value="upload"
              id="modeUpload"
              checked={mode === "upload"}
              onChange={handleModeChange}
              disabled={disabled}
            />
            <label className="form-check-label" htmlFor="modeUpload">
              Charger un fichier
            </label>
          </div>
          <div className="form-check form-check-inline">
            <input
              className="form-check-input"
              type="radio"
              value="generate"
              id="modeGenerate"
              checked={mode === "generate"}
              onChange={handleModeChange}
              disabled={disabled}
            />
            <label className="form-check-label" htmlFor="modeGenerate">
              Générer automatiquement
            </label>
          </div>
        </div>
      </div>

      {/* Cas upload classique */}
      {mode === "upload" && (
        <div className="mb-3">
          <label>Justificatif principal (format PDF) *</label>
          {!hideLabelsInView && (
            <input type="file" onChange={handleMainChange} className="form-control" disabled={disabled} />
          )}
          {mainAttachment && (
            <div className="mt-1 d-flex justify-content-between align-items-center">
              <span>{mainAttachment.file_name}</span>
              {!hideLabelsInView && (
                <SmallDeleteButton onClick={() => removeFile(0, 'main')} disabled={disabled} />               
              )}
            </div>
          )}
        </div>
      )}

      {/* Cas génération */}
      {mode === "generate" && (
        <p className="text-muted">
          Le justificatif sera généré automatiquement lors de la sauvegarde de la facture.
        </p>
      )}

      {/* Justificatifs additionnels (toujours possibles) */}
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
