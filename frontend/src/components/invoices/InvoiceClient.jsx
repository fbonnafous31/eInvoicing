// frontend/src/components/invoices/InvoiceClient.jsx
import { useEffect, useState, useCallback } from "react";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import Select from "react-select";
import { fetchClients, createClient, updateClient } from "../../services/clients";
import { validateClient } from "../../utils/validators/client";

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
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // Charger tous les clients
  useEffect(() => {
    fetchClients()
      .then((data) =>
        setClients(data.sort((a, b) => (a.legal_name || "").localeCompare(b.legal_name || "")))
      )
      .catch(console.error);
  }, []);

  // Propagation stable
  const propagate = useCallback(
    (client) => {
      onChange({
        id: client?.id || null,
        type: client?.type || null,
        firstName: client?.firstName || "",
        lastName: client?.lastName || "",
        legal_name: client?.legal_name || "",
        siret: client?.siret || "",
        vatNumber: client?.vatNumber || "",
        address: client?.address || "",
        city: client?.city || "",
        postal_code: client?.postal_code || "",
        country_code: client?.country_code || "",
        email: client?.email || "",
        phone: client?.phone || "",
      });
    },
    [onChange]
  );

  // Préselection depuis le parent
  useEffect(() => {
    if (!value || clients.length === 0) return;

    const client = clients.find((c) => c.id === value.id || c.id === value);
    if (client) setSelectedClient(client);
  }, [value, clients]);

  // Mettre à jour formData quand selectedClient change
  useEffect(() => {
    if (!selectedClient) return;

    const type = determineClientType(selectedClient);
    const newFormData = {
      ...selectedClient,
      type,
      firstName: selectedClient.firstname || "",
      lastName: selectedClient.lastname || "",
      legal_name: selectedClient.legal_name || "",
      siret: selectedClient.siret || "",
      vatNumber: selectedClient.vat_number || "",
      address: selectedClient.address || "",
      city: selectedClient.city || "",
      postal_code: selectedClient.postal_code || "",
      country_code: selectedClient.country_code || "",
      email: selectedClient.email || "",
      phone: selectedClient.phone || "",
    };

    const isDifferent = JSON.stringify(newFormData) !== JSON.stringify(formData);
    if (isDifferent) {
      setFormData(newFormData);
      propagate(newFormData);
    }
  }, [selectedClient, propagate, formData]);

  const handleSelect = (id) => {
    const client = clients.find((c) => c.id === id);
    setSelectedClient(client || null);
  };

  const handleChangeField = (field, val) => {
    const updated = { ...formData, [field]: val };
    setFormData(updated);
    propagate(updated);
  };

  const handleSave = async () => {
    console.log("handleSave called", formData)
    const validationErrors = validateClient(formData);
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

      setSelectedClient(saved);
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
      <label htmlFor="clientSelect" className="form-label">
        Client *
      </label>
      <Select
        inputId="clientSelect"
        value={
          selectedClient
            ? {
                value: selectedClient.id,
                label:
                  selectedClient.legal_name ||
                  `${selectedClient.firstname || ""} ${selectedClient.lastname || ""}`,
              }
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

        <button
          type="button"
          className="btn btn-sm btn-primary mt-2"
          onClick={handleSave}
        >
          Enregistrer ce client
        </button>
      </div>

      {error && <div className="text-danger mt-1">{error}</div>}
    </div>
  );
}
