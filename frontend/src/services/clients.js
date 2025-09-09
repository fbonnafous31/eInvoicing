const API_BASE = "http://localhost:3000/api/clients";

/**
 * Récupère tous les clients
 */
export async function fetchClients(token) {
  const res = await fetch(`${API_BASE}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement des clients`);
  return res.json();
}

/**
 * Récupère un client par son ID
 */
export async function fetchClient(id, token) {
  const res = await fetch(`${API_BASE}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Erreur ${res.status} lors du chargement du client`);
  return res.json();
}

/**
 * Crée un nouveau client
 */
export async function createClient(clientData, token) {
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(clientData),
  });
  if (!res.ok) throw new Error("Erreur lors de la création du client");
  return res.json();
}

/**
 * Met à jour un client existant
 */
export async function updateClient(id, clientData, token) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(clientData),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour du client");
  return res.json();
}

/**
 * Supprime un client
 */
export async function deleteClient(id, token) {
  const res = await fetch(`${API_BASE}/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Erreur lors de la suppression du client");
  return true;
}

/**
 * Vérifie si un SIRET existe déjà pour un autre client
 */
export async function checkSiret(siret, token, clientId = null) {
  const url = new URL(`${API_BASE}/check-siret/${siret}`);
  if (clientId) url.searchParams.append("id", clientId);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Erreur API SIRET: ${res.status} - ${text}`);
  }
  return res.json(); // { exists: true/false }
}
