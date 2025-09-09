const API_BASE = "http://localhost:3000/api/invoices";

/**
 * Récupère toutes les factures de l'utilisateur connecté avec token Auth0
 * @param {string} token
 */
export async function fetchInvoicesBySeller(token) {
  const res = await fetch("http://localhost:3000/api/invoices", {
    headers: {
      Authorization: `Bearer ${token}`, // on envoie le token
    },
  });

  if (!res.ok) {
    throw new Error(`Erreur ${res.status} lors du chargement des factures`);
  }

  return res.json();
}

/**
 * Récupère toutes les factures
 */
export async function fetchInvoices() {
  const response = await fetch(API_BASE);
  if (!response.ok) throw new Error("Erreur lors de la récupération des factures");
  return response.json();
}

/**
 * Récupère une facture par son ID avec token Auth0
 * @param {string|number} id
 * @param {string} token
 */
export async function fetchInvoice(id, token) {
  const response = await fetch(`${API_BASE}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`, 
    },
  });

  if (!response.ok) throw new Error(`Erreur ${response.status} lors de la récupération de la facture`);
  return response.json();
}

/**
 * Crée une nouvelle facture
 */
export async function createInvoice(formData, token) {
  console.log("Data being sent to createInvoice:", formData);
  const response = await fetch(API_BASE, { 
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`, 
    },
  });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la création de la facture");
  }
  return response.json();
}

/**
 * Met à jour une facture existante
 */
export async function updateInvoice(id, formData, token) {
  const response = await fetch(`${API_BASE}/${id}`, { 
    method: "PUT",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`, // ← essentiel
    },
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
 * @param {string} token - token Auth0 de l'utilisateur
 */
export async function deleteInvoice(id, token) {
  if (!token) throw new Error("Token manquant pour supprimer la facture");

  const response = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la suppression de la facture");
  }

  return true;
}

/**
 * Génère un PDF pour une facture existante
 * @param {string|number} id
 */
export async function generateInvoicePdf(id) {
  const response = await fetch(`${API_BASE}/${id}/generate-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || data.message || "Erreur lors de la génération du PDF");
  }

  return response.json(); 
}
