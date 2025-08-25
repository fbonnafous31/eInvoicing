const API_BASE = "http://localhost:3000/api/invoices";

/**
 * Récupère toutes les factures
 */
export async function fetchInvoices() {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error("Erreur lors de la récupération des factures");
  return response.json();
}

/**
 * Récupère une facture par son ID
 * @param {string|number} id
 */
export async function fetchInvoice(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) throw new Error("Erreur lors de la récupération de la facture");
  return response.json();
}

/**
 * Crée une nouvelle facture
 * @param {Object} params - { invoice, client, lines, taxes, attachments }
 */
export async function createInvoice(formData) {
  const response = await fetch(API_BASE, { method: "POST", body: formData });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la création de la facture");
  }
  return response.json();
}

/**
 * Met à jour une facture existante
 */
export async function updateInvoice(id, { invoice, client, lines, taxes, attachments }) {
  const formData = new FormData();

  attachments?.forEach(file => formData.append('files', file));

  const attachmentsMeta = attachments?.map(a => ({
    attachment_type: a.attachment_type || 'additional'
  })) || [];
  formData.append('attachments_meta', JSON.stringify(attachmentsMeta));

  formData.append('invoice', JSON.stringify(invoice));
  formData.append('client', JSON.stringify(client));
  formData.append('lines', JSON.stringify(lines || []));
  formData.append('taxes', JSON.stringify(taxes || []));

  const response = await fetch(`${API_BASE}/${id}`, { method: "PUT", body: formData });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la mise à jour de la facture");
  }

  return response.json();
}

/**
 * Supprime une facture
 */
export async function deleteInvoice(id) {
  const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la suppression de la facture");
  }
  return response.json();
}
