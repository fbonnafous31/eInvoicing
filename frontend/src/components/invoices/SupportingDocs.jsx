import React, { useEffect } from 'react';

export default function SupportingDocs({ data, onChange }) {
  const mainAttachment = data.find(a => a.attachment_type === 'main');
  const additionalAttachments = data.filter(a => a.attachment_type === 'additional');

  // Log pour debug
  useEffect(() => {
    console.log("Current attachments array:", data);
  }, [data]);

  const handleMainChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const newFile = {
      file_name: file.name,
      raw_file: file,
      attachment_type: 'main'
    };

    const newData = [
      ...data.filter(a => a.attachment_type !== 'main'),
      newFile
    ];

    console.log("Adding main attachment:", newFile);
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
    const filtered = data.filter((_, i) => {
      if (type === 'main') return data[i].attachment_type !== 'main';
      return i !== index;
    });
    console.log(`Removing ${type} file at index ${index}`);
    onChange(filtered);
  };

  return (
    <div className="card p-3 mb-3">
      <h5>Justificatifs</h5>

      <div className="mb-3">
        <label>Justificatif principal *</label>
        <input
          type="file"
          onChange={handleMainChange}
          className="form-control"
        />
        {mainAttachment && (
          <div className="mt-1 d-flex justify-content-between align-items-center">
            <span>{mainAttachment.file_name}</span>
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => removeFile(0, 'main')}
            >
              Supprimer
            </button>
          </div>
        )}
      </div>

      <div className="mb-3">
        <label>Justificatifs additionnels</label>
        <input
          type="file"
          multiple
          onChange={handleAdditionalChange}
          className="form-control mb-2"
        />
        <ul>
          {additionalAttachments.map((file, index) => (
            <li key={index} className="d-flex justify-content-between align-items-center">
              <span>{file.file_name || "Nom non disponible"}</span>
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => removeFile(index, 'additional')}
              >
                Supprimer
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
