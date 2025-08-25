import { useEffect, useState, useCallback } from "react";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import Select from "react-select";
import { fetchClients, createClient, updateClient } from "../../services/clients";
import { validateClientData } from "../../utils/validators/invoice";

const clientTypeOptions = [
  { value: "individual", label: "Particulier" },
  { value: "company_fr", label: "Entreprise (France)" },
  { value: "company_eu", label: "Entreprise (UE)" },
];

const determineClientType = (client) => {
  if (!client) return null;
  if (!client.is_company) return "individual";
  return client.country_code === "FR" ? "company_fr" : "company_eu";
};

export default function InvoiceClient({ value, onChange, error }) {
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});

  const propagate = useCallback(
    (data) => {
      if (!data) {
        onChange(null);
        return;
      }

      // Pour les individus, mettre à jour le nom légal
      if (data.type === "individual") {
        data.legal_name = `${data.firstname || ""} ${data.lastname || ""}`.trim();
      }

      // Mapping exact attendu par InvoiceHeader
      onChange({
        client_id: data.id || null,
        client_type: data.type || null,
        client_first_name: data.firstname || "",
        client_last_name: data.lastname || "",
        client_legal_name: data.legal_name || "",
        client_siret: data.siret || "",
        client_vat_number: data.vat_number || "",
        client_address: data.address || "",
        client_city: data.city || "",
        client_postal_code: data.postal_code || "",
        client_country_code: data.country_code || "",
        client_email: data.email || "",
        client_phone: data.phone || "",
      });
    },
    [onChange]
  );

  useEffect(() => {
    fetchClients()
      .then((data) =>
        setClients(data.sort((a, b) => (a.legal_name || "").localeCompare(b.legal_name || "")))
      )
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!value || clients.length === 0) return;

    const client = clients.find((c) => c.id === value.id || c.id === value);
    if (!client) return;

    setFormData((prev) => {
      if (Object.keys(prev).length === 0) {
        const data = {
          ...client,
          type: determineClientType(client),
          firstname: client.firstname || "",
          lastname: client.lastname || "",
          legal_name: client.legal_name || "",
          siret: client.siret || "",
          vat_number: client.vat_number || "",
          address: client.address || "",
          city: client.city || "",
          postal_code: client.postal_code || "",
          country_code: client.country_code || "",
          email: client.email || "",
          phone: client.phone || "",
        };
        propagate(data);
        return data;
      }
      return prev;
    });
  }, [value, clients, propagate]);

  const handleSelect = (id) => {
    if (!id) {
      setFormData({});
      propagate(null);
      return;
    }

    const client = clients.find((c) => c.id === id);
    if (!client) return;

    const data = {
      ...client,
      type: determineClientType(client),
      firstname: client.firstname || "",
      lastname: client.lastname || "",
      legal_name: client.legal_name || "",
      siret: client.siret || "",
      vat_number: client.vat_number || "",
      address: client.address || "",
      city: client.city || "",
      postal_code: client.postal_code || "",
      country_code: client.country_code || "",
      email: client.email || "",
      phone: client.phone || "",
    };

    setFormData(data);
    propagate(data);
  };

  const handleChangeField = (field, val) => {
    const updated = { ...formData, [field]: val };
    if (updated.type === "individual") {
      updated.legal_name = `${updated.firstname || ""} ${updated.lastname || ""}`.trim();
    }

    setFormData(updated);
    const fieldError = validateClientData(field, updated);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    propagate(updated);
  };

  const handleBlurField = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const fieldError = validateClientData(field, formData);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };

  const handleSave = async () => {
    const requiredFields = [
      "client_first_name",
      "client_last_name",
      "legal_name",
      "client_siret",
      "client_vat_number",
      "client_address"
    ];
    const validationErrors = {};

    requiredFields.forEach(f => {
      const e = validateClientData(f, formData);
      if (e) validationErrors[f] = e;
    });

    // Marquer tous les champs requis comme touchés
    setTouchedFields(prev => ({
      ...prev,
      ...requiredFields.reduce((acc, f) => ({ ...acc, [f]: true }), {})
    }));

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return; // Bloque le submit si des erreurs
    }

    try {
      let saved;
      if (formData.id) {
        saved = await updateClient(formData.id, formData);
      } else {
        saved = await createClient(formData);
        setClients(prev =>
          [...prev, saved].sort((a, b) => (a.legal_name || "").localeCompare(b.legal_name || ""))
        );
      }

      setFormData(saved);
      propagate(saved);
      setErrors({});
      setTouchedFields({});
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du client.");
    }
  };

  const selectValue = clients
    .map(c => ({
      value: c.id,
      label: c.legal_name || `${c.firstname || ""} ${c.lastname || ""}`
    }))
    .find(o => o.value === formData.id) || null;

  return (
    <div className="mb-3">
      <label htmlFor="clientSelect" className="form-label">Client</label>
      <Select
        inputId="clientSelect"
        value={selectValue}
        onChange={(option) => handleSelect(option?.value)}
        options={clients.map(c => ({
          value: c.id,
          label: c.legal_name || `${c.firstname || ""} ${c.lastname || ""}`
        }))}
        isClearable
        isSearchable
        placeholder="Rechercher un client..."
      />

      <div className="border p-2 mt-2 rounded bg-light">
        <SelectField
          label="Type de client"
          value={formData.type || ""}
          onChange={(val) => handleChangeField("type", val)}
          onBlur={() => handleBlurField("type")}
          options={clientTypeOptions}
          required
        />

        {formData.type === "individual" && (
          <>
            <InputField
              label="Nom complet"
              value={`${formData.firstname || ""} ${formData.lastname || ""}`.trim()}
              onChange={() => {}}
              disabled
            />
            <InputField
              label="Prénom"
              value={formData.firstname || ""}
              onChange={(val) => handleChangeField("firstname", val)}
              onBlur={() => handleBlurField("firstname")}
              error={errors.firstname}
              touched={touchedFields.firstname}
              required
            />
            <InputField
              label="Nom"
              value={formData.lastname || ""}
              onChange={(val) => handleChangeField("lastname", val)}
              onBlur={() => handleBlurField("lastname")}
              error={errors.lastname}
              touched={touchedFields.lastname}
              required
            />
          </>
        )}

        {(formData.type === "company_fr" || formData.type === "company_eu") && (
          <InputField
            label="Raison sociale"
            value={formData.legal_name || ""}
            onChange={(val) => handleChangeField("legal_name", val)}
            onBlur={() => handleBlurField("legal_name")}
            error={errors.legal_name}
            touched={touchedFields.legal_name}
            required
          />
        )}

        {formData.type === "company_fr" && (
          <InputField
            label="SIRET"
            value={formData.siret || ""}
            onChange={(val) => handleChangeField("siret", val)}
            onBlur={() => handleBlurField("siret")}
            error={errors.siret}
            touched={touchedFields.siret}
            required
          />
        )}

        {formData.type === "company_eu" && (
          <InputField
            label="TVA intracommunautaire"
            value={formData.vat_number || ""}
            onChange={(val) => handleChangeField("vat_number", val)}
            onBlur={() => handleBlurField("vat_number")}
            error={errors.vat_number}
            touched={touchedFields.vat_number}
            required
          />
        )}

        <InputField
          label="Adresse"
          value={formData.address || ""}
          onChange={(val) => handleChangeField("address", val)}
          onBlur={() => handleBlurField("address")}
          error={errors.address}
          touched={touchedFields.address}
          required
        />
        <InputField
          label="Ville"
          value={formData.city || ""}
          onChange={(val) => handleChangeField("city", val)}
        />
        <InputField
          label="Code postal"
          value={formData.postal_code || ""}
          onChange={(val) => handleChangeField("postal_code", val)}
        />
        <InputField
          label="Pays"
          value={formData.country_code || ""}
          onChange={(val) => handleChangeField("country_code", val)}
        />
        <InputField
          label="eMail"
          value={formData.email || ""}
          onChange={(val) => handleChangeField("email", val)}
        />
        <InputField
          label="Téléphone"
          value={formData.phone || ""}
          onChange={(val) => handleChangeField("phone", val)}
        />

        <button type="button" className="btn btn-sm btn-primary mt-2" onClick={handleSave}>
          Enregistrer ce client
        </button>
      </div>

      {error && <div className="text-danger mt-1">{error}</div>}
    </div>
  );
}
