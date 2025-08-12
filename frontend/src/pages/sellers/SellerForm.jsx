import { useState } from "react";

export default function SellerForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    legal_name: "",
    legal_identifier: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nom légal :</label>
        <input
          type="text"
          name="legal_name"
          value={formData.legal_name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label>Identifiant légal :</label>
        <input
          type="text"
          name="legal_identifier"
          value={formData.legal_identifier}
          onChange={handleChange}
          required
        />
      </div>
      <button type="submit">Créer</button>
    </form>
  );
}
