import React from 'react';

export default function SupportingDocs({ data, onChange }) {
  // Ajout de fichiers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files); // fichiers réels
    onChange([...data, ...files]); // on stocke les objets File directement
  };

  // Suppression d’un fichier
  const removeFile = (index) => onChange(data.filter((_, i) => i !== index));

  return (
    <div className="card p-3 mb-3">
      <h5>Justificatifs</h5>
      <input
        type="file"
        multiple
        onChange={handleFileChange}
        className="form-control mb-2"
      />
      <ul>
        {data.map((file, index) => (
          <li key={index}>
            {file.name}{" "}
            <button
              type="button"
              className="btn btn-sm btn-danger"
              onClick={() => removeFile(index)}
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
