import { useEffect, useState, useCallback } from "react";
import InputField from "../form/InputField";
import SelectField from "../form/SelectField";
import Select from "react-select";
import { fetchClients } from "../../services/clients";
import { validateClientData } from "../../utils/validators/invoice";
import { validateOptionalEmail } from "../../utils/validators/email";
import { isValidSiret } from "../../utils/validators/siret";
import { validatePhoneNumber } from "../../utils/validators/phone_number";
import { isValidPostalCode } from "../../utils/validators/postal_code";

import countries from "i18n-iso-countries";
import enLocale from "i18n-iso-countries/langs/en.json";
countries.registerLocale(enLocale);
const countryCodes = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));


const clientTypeOptions = [
  { value: "individual", label: "Particulier" },
  { value: "company_fr", label: "Entreprise (France)" },
  { value: "company_eu", label: "Entreprise (UE)" },
];

const determineClientType = (client) => {
    if (!client) return null;

    // Gère les objets avec ou sans préfixe "client_"
    const siret = client.siret || client.client_siret;
    const vat_number = client.vat_number || client.client_vat_number;
    const firstname = client.firstname || client.client_first_name;
    const lastname = client.lastname || client.client_last_name;

    if (vat_number) {
        // La logique originale vérifiait un format SIRET dans le champ TVA.
        // On la conserve pour ne pas introduire de régression, mais une validation de TVA européenne serait plus juste.
        if (/^\d{14}$/.test(vat_number)) return "company_fr";
        return "company_eu";
    }

    if (siret) return "company_fr";
    if (firstname && lastname) return "individual";

    return null;
};

export default function InvoiceClient({ value, onChange, error, disabled }) {
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
    // Cet effet synchronise l'état interne `formData` avec la prop `value` venant du parent.
    // Il est crucial pour charger les données initiales de la facture.
    if (value && Object.keys(value).length > 0) {
      setFormData({
        id: value.client_id || null,
        type: value.client_type || determineClientType(value),
        firstname: value.client_first_name || "",
        lastname: value.client_last_name || "",
        legal_name: value.client_legal_name || "",
        siret: value.client_siret || "",
        vat_number: value.client_vat_number || "",
        address: value.client_address || "",
        city: value.client_city || "",
        postal_code: value.client_postal_code || "",
        country_code: value.client_country_code || "FR",
        email: value.client_email || "",
        phone: value.client_phone || "",
      });
    } else {
      // Si la prop `value` est vide ou nulle, on s'assure de vider aussi l'état interne.
      setFormData({});
    }
  }, [value]);

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
    setErrors(prev => ({ ...prev, [field]: validateClientData(field, updated) }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    propagate(updated);
  };

  const handleBlurField = (field) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const fieldError = validateClientData(field, formData);
    setErrors(prev => ({ ...prev, [field]: fieldError }));
  };


  const selectValue = clients
    .map(c => ({
      value: c.id,
      label: c.legal_name || `${c.firstname || ""} ${c.lastname || ""}`
    }))
    .find(o => o.value === formData.id) || null;

  return (
    <div className="mb-3">
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
        isDisabled={disabled} 
      />

      <div className="border p-2 mt-2 rounded bg-light">
        <SelectField
          label="Type de client"
          value={formData.type || ""}
          onChange={(val) => handleChangeField("type", val)}
          onBlur={() => handleBlurField("type")}
          options={clientTypeOptions}
          required
          disabled={disabled} 
        />

        {formData.type === "individual" && (
          <>
            <InputField
              label="Nom complet"
              value={`${formData.firstname || ""} ${formData.lastname || ""}`.trim()}
              onChange={() => {}}
              disabled={disabled}               
            />
            <InputField
              label="Prénom"
              value={formData.firstname || ""}
              onChange={(val) => handleChangeField("firstname", val)}
              onBlur={() => handleBlurField("firstname")}
              error={errors.firstname}
              touched={touchedFields.firstname}
              required
              disabled={disabled} 
            />
            <InputField
              label="Nom"
              value={formData.lastname || ""}
              onChange={(val) => handleChangeField("lastname", val)}
              onBlur={() => handleBlurField("lastname")}
              error={errors.lastname}
              touched={touchedFields.lastname}
              required
              disabled={disabled} 
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
            disabled={disabled} 
          />
        )}

        {formData.type === "company_fr" && (
          <InputField
            label="SIRET"
            value={formData.siret || ""}
            onChange={(val) => {
              handleChangeField("siret", val);
              let error = "";
              if (!val) error = "Le SIRET est obligatoire";
              else if (!isValidSiret(val)) error = "SIRET invalide";
              setErrors(prev => ({ ...prev, siret: error }));
            }}
            onBlur={() => {
              handleBlurField("siret");
              let error = "";
              if (!formData.siret) error = "Le SIRET est obligatoire";
              else if (!isValidSiret(formData.siret)) error = "SIRET invalide";
              setErrors(prev => ({ ...prev, siret: error }));
            }}
            error={errors.siret}
            touched={touchedFields.siret}
            required
            disabled={disabled} 
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
            disabled={disabled} 
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
            disabled={disabled} 
          />
          <InputField
            label="Code postal"
            value={formData.postal_code || ""}
            onChange={(val) => {
              handleChangeField("postal_code", val);
              const error = isValidPostalCode(val) ? "" : "Code postal invalide";
              setErrors(prev => ({ ...prev, postal_code: error }));
            }}
            onBlur={() => {
              handleBlurField("postal_code");
              const error = isValidPostalCode(formData.postal_code) ? "" : "Code postal invalide";
              setErrors(prev => ({ ...prev, postal_code: error }));
            }}
            error={errors.postal_code}
            touched={touchedFields.postal_code}
            disabled={disabled} 
          />
      
        <InputField
          label="Ville"
          value={formData.city || ""}
          onChange={(val) => handleChangeField("city", val)}
          disabled={disabled} 
        />
        <SelectField
          label="Pays"
          name="country_code"
          value={formData.country_code || "FR"}
          onChange={(val) => handleChangeField("country_code", val)}
          onBlur={() => handleBlurField("country_code")}
          touched={touchedFields.country_code}
          options={countryCodes.map(c => ({ value: c.code, label: `${c.code} - ${c.name}` }))}
          error={errors.country_code}
          disabled={disabled} 
        />        
        <InputField
          label="Email"
          value={formData.email || ""}
          onChange={(val) => {
            handleChangeField("email", val);
            const error = validateOptionalEmail(val);
            setErrors(prev => ({ ...prev, email: error }));
          }}
          onBlur={() => {
            handleBlurField("email");
            const error = validateOptionalEmail(formData.email);
            setErrors(prev => ({ ...prev, email: error }));
          }}
          error={errors.email}
          touched={touchedFields.email}
          disabled={disabled} 
        />  
        <InputField
          label="Téléphone"
          value={formData.phone || ""}
          onChange={(val) => {
            handleChangeField("phone", val);
            const error = validatePhoneNumber(val);
            setErrors(prev => ({ ...prev, phone: error }));
          }}
          onBlur={() => {
            handleBlurField("phone");
            const error = validatePhoneNumber(formData.phone);
            setErrors(prev => ({ ...prev, phone: error }));
          }}
          error={errors.phone}
          touched={touchedFields.phone}
          disabled={disabled} 
        />
      </div>

      {error && <div className="text-danger mt-1">{error}</div>}
    </div>
  );
}
