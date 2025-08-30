import React, { useEffect } from 'react';
import { SmallDeleteButton } from '@/components/ui/buttons';

export default function SupportingDocs({ data, onChange, disabled, hideLabelsInView }) {

  // Logs pour debug
  useEffect(() => {
    console.log("Current attachments array:", data);
  }, [data]);

  const mainAttachment = data.find(a => a.attachment_type === 'main');
  const additionalAttachments = data.filter(a => a.attachment_type === 'additional');

  const handleMainChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const mainFile = {
      file_name: file.name,
      raw_file: file,
      attachment_type: 'main'
    };

    // Toujours mettre le fichier principal en première position
    const newData = [mainFile, ...data.filter(a => a.attachment_type !== 'main')];
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
      newData = data.filter(a => a.attachment_type !== 'main');
    } else {
      // Supprime le i-ème fichier additionnel
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
        <label>Justificatif principal *</label>
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

      <div className="mb-3">
        <label>Justificatifs additionnels</label>
        {!hideLabelsInView && (
          <input type="file" multiple onChange={handleAdditionalChange} className="form-control mb-2" disabled={disabled} />
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
