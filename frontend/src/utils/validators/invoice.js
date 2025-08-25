export function validateInvoiceField(field, value, data = {}) {
  const issueYear = data.issue_date ? new Date(data.issue_date).getFullYear() : new Date().getFullYear();
  let error;

  switch(field) {
    case "invoice_number":
      if (!value) error = "Ce champ est obligatoire";
      break;
    case "issue_date":
      if (!value) error = "Ce champ est obligatoire";
      break;
    case "fiscal_year":
      if (value < issueYear - 1 || value > issueYear + 1) {
        error = `L’exercice fiscal doit être compris entre ${issueYear - 1} et ${issueYear + 1}`;
      }
      break;
    case "seller_id":
      if (!value) error = "Ce champ est obligatoire";
      break;
    case "client_id":
      if (!value) error = "Ce champ est obligatoire";
      break;
    default:
      break;
  }

  return error; // undefined si pas d'erreur
}

/**
 * Valide une ligne de facture
 * @param {Object} line - La ligne de facture { description, quantity, unit_price, discount, vat_rate }
 * @returns {Object} - Un objet avec les erreurs par champ
 */
export function validateInvoiceLine(line = {}) {
  const errors = {};

  if (!line.description || line.description.trim() === "") {
    errors.description = "Ce champ est obligatoire";
  }

  if (line.quantity === undefined || line.quantity === null || line.quantity === "") {
    errors.quantity = "Quantité obligatoire";
  } else if (isNaN(line.quantity) || parseFloat(line.quantity) <= 0) {
    errors.quantity = "Quantité invalide";
  }

  if (line.unit_price === undefined || line.unit_price === null || line.unit_price === "") {
    errors.unit_price = "Prix unitaire obligatoire";
  } else if (isNaN(line.unit_price) || parseFloat(line.unit_price) < 0) {
    errors.unit_price = "Prix unitaire invalide";
  }

  if (line.discount !== undefined && (isNaN(line.discount) || parseFloat(line.discount) < 0)) {
    errors.discount = "Remise invalide";
  }

  if (line.vat_rate !== undefined && (isNaN(line.vat_rate) || parseFloat(line.vat_rate) < 0)) {
    errors.vat_rate = "Taux TVA invalide";
  }

  return errors; // objet vide {} si pas d'erreurs
}

export function validateClientData(field, data) {
  switch (field) {
    case "client_first_name":
      if (data.client_type === "individual" && !data.client_first_name?.trim())
        return "Prénom obligatoire";
      break;
    case "client_last_name":
      if (data.client_type === "individual" && !data.client_last_name?.trim())
        return "Nom obligatoire";
      break;
    case "client_address":
      if (
        ["individual", "company_fr", "company_eu"].includes(data.client_type) &&
        !data.client_address?.trim()
      )
        return "Adresse obligatoire";
      break;
    case "client_siret":
      if (data.client_type === "company_fr" && !data.client_siret?.trim())
        return "SIRET obligatoire";
      break;
    case "client_vat_number":
      if (data.client_type === "company_eu" && !data.client_vat_number?.trim())
        return "TVA intracommunautaire obligatoire";
      break;
    case "client_legal_name":
      if (["company_fr", "company_eu"].includes(data.client_type) && !data.client_legal_name?.trim())
        return "Raison sociale obligatoire";
      break;
    default:
      return "";
  }
  return "";
}

