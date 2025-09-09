// frontend/src/services/clients.js
const API_BASE = "http://localhost:3000/api/clients";

/**
 * Récupère tous les clients avec token Auth0
 * @param {string} token
 */
export async function fetchClients(token) {
  const res = await fetch("http://localhost:3000/api/clients", {
    headers: {
      Authorization: `Bearer ${token}`, // on envoie le token
    },
  });

  if (!res.ok) {
    throw new Error(`Erreur ${res.status} lors du chargement des clients`);
  }

  return res.json();
}

/**
 * Récupère un client par son ID
 * @param {string|number} id 
 */
export async function fetchClient(id) {
  const res = await fetch(`${API_BASE}/${id}`);
  if (!res.ok) throw new Error("Erreur lors du chargement du client");
  return res.json();
}

/**
 * Crée un nouveau client
 * @param {object} clientData 
 */
export async function createClient(clientData) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clientData),
  });
  if (!res.ok) throw new Error("Erreur lors de la création du client");
  return res.json();
}

/**
 * Met à jour un client existant
 * @param {string|number} id 
 * @param {object} clientData 
 */
export async function updateClient(id, clientData) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(clientData),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour du client");
  return res.json();
}

/**
 * Supprime un client
 * @param {string|number} id 
 */
export async function deleteClient(id) {
  const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erreur lors de la suppression du client");
  return true;
}

/**
 * Vérifie si un SIRET existe déjà pour un autre client
 * @param {string} siret
 * @param {number} clientId
 */
export async function checkSiret(siret, clientId = null) {
  const url = new URL(`${API_BASE}/check-siret/${siret}`);
  if (clientId) url.searchParams.append("id", clientId);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API SIRET: ${res.status} - ${text}`);
  }
  return res.json(); // { exists: true/false }
}


