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

  const propagate = useCallback(
    (data) => {
      if (!data) {
        onChange(null);
        return;
      }

      // Pour les individus, mettre à jour legal_name automatiquement
      if (data.type === "individual") {
        data.legal_name = `${data.firstName || ""} ${data.lastName || ""}`.trim();
      }

      onChange({
        id: data?.id || null,
        type: data?.type || null,
        firstName: data?.firstName || "",
        lastName: data?.lastName || "",
        legal_name: data?.legal_name || "",
        siret: data?.siret || "",
        client_vat_number: data?.vatNumber || "",
        address: data?.address || "",
        city: data?.city || "",
        postal_code: data?.postal_code || "",
        country_code: data?.country_code || "",
        email: data?.email || "",
        phone: data?.phone || "",
      });
    },
    [onChange]
  );

  // Charger tous les clients
  useEffect(() => {
    fetchClients()
      .then((data) =>
        setClients(data.sort((a, b) => (a.legal_name || "").localeCompare(b.legal_name || "")))
      )
      .catch(console.error);
  }, []);

  // Pré-remplissage si value vient du parent
  useEffect(() => {
    if (!value || clients.length === 0) return;

    const client = clients.find((c) => c.id === value.id || c.id === value);
    if (!client) return;

    setFormData((prev) => {
      if (Object.keys(prev).length === 0) {
        const data = {
          ...client,
          type: determineClientType(client),
          firstName: client.firstname || "",
          lastName: client.lastname || "",
          legal_name: client.legal_name || "",
          siret: client.siret || "",
          vatNumber: client.client_vat_number || "",
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
      firstName: client.firstname || "",
      lastName: client.lastname || "",
      legal_name: client.legal_name || "",
      siret: client.siret || "",
      vatNumber: client.client_vat_number || "",
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

    // Si c'est un individu, mettre à jour legal_name
    if (updated.type === "individual" && (field === "firstName" || field === "lastName")) {
      updated.legal_name = `${updated.firstName || ""} ${updated.lastName || ""}`.trim();
    }

    setFormData(updated);
    propagate(updated);

    const fieldError = validateClientData(field, updated);
    setErrors((prev) => ({ ...prev, [field]: fieldError }));
  };

  const handleSave = async () => {
    const validationErrors = validateClientData(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      let saved;
      if (formData.id) {
        saved = await updateClient(formData.id, formData);
      } else {
        saved = await createClient(formData);
        setClients((prev) =>
          [...prev, saved].sort((a, b) => (a.legal_name || "").localeCompare(b.legal_name || ""))
        );
      }

      setFormData(saved);
      propagate(saved);
      setErrors({});
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'enregistrement du client.");
    }
  };

  return (
    <div className="mb-3">
      <label htmlFor="clientSelect" className="form-label">Client</label>
      <Select
        inputId="clientSelect"
        value={
          formData.id
            ? { value: formData.id, label: formData.legal_name || `${formData.firstName} ${formData.lastName}` }
            : null
        }
        onChange={(option) => handleSelect(option?.value)}
        options={clients.map((c) => ({
          value: c.id,
          label: c.legal_name || `${c.firstname || ""} ${c.lastname || ""}`,
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
          options={clientTypeOptions}
          required
        />

        {formData.type === "individual" && (
          <>
            <InputField
              label="Nom complet"
              value={`${formData.firstName || ""} ${formData.lastName || ""}`.trim()}
              onChange={() => {}}
              disabled
            />
            <InputField
              label="Prénom"
              value={formData.firstName || ""}
              onChange={(val) => handleChangeField("firstName", val)}
              error={errors.firstName}
              required
            />
            <InputField
              label="Nom"
              value={formData.lastName || ""}
              onChange={(val) => handleChangeField("lastName", val)}
              error={errors.lastName}
              required
            />
          </>
        )}

        {(formData.type === "company_fr" || formData.type === "company_eu") && (
          <InputField
            label="Raison sociale"
            value={formData.legal_name || ""}
            onChange={(val) => handleChangeField("legal_name", val)}
            error={errors.legal_name}
            required
          />
        )}

        {formData.type === "company_fr" && (
          <InputField
            label="SIRET"
            value={formData.siret || ""}
            onChange={(val) => handleChangeField("siret", val)}
            error={errors.siret}
            required
          />
        )}

        {formData.type === "company_eu" && (
          <InputField
            label="TVA intracommunautaire"
            value={formData.vatNumber || ""}
            onChange={(val) => handleChangeField("vatNumber", val)}
            error={errors.vatNumber}
            required
          />
        )}

        <InputField
          label="Adresse"
          value={formData.address || ""}
          onChange={(val) => handleChangeField("address", val)}
          error={errors.address}
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
          label="Email"
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
