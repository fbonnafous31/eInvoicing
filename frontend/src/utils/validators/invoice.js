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
