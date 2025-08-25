// frontend/src/services/invoices.js

const API_BASE = "http://localhost:3000/api/invoices";

/**
 * Récupère toutes les factures
 */
export async function fetchInvoices() {
  const response = await fetch(API_BASE);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des factures");
  }
  return response.json();
}

/**
 * Récupère une facture par son ID
 * @param {string|number} id
 */
export async function fetchInvoice(id) {
  const response = await fetch(`${API_BASE}/${id}`);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération de la facture");
  }
  return response.json();
}

/**
 * Crée une nouvelle facture
 * @param {FormData} formData
 */
export async function createInvoice(formData) {
  console.log("Payload invoice envoyé au backend :", formData);
  const response = await fetch(API_BASE, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    // Essayer de récupérer le message spécifique renvoyé par le backend
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la création de la facture");
  }

  return response.json();
}

/**
 * Met à jour une facture existante
 * @param {string|number} id
 * @param {FormData} formData
 */
export async function updateInvoice(id, formData) {
  const response = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la mise à jour de la facture");
  }

  return response.json();
}

/**
 * Supprime une facture
 * @param {string|number} id
 */
export async function deleteInvoice(id) {
  const response = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la suppression de la facture");
  }

  return response.json();
}
