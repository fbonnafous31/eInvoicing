// frontend/src/services/sellers.js

const BASE_URL = "http://localhost:3000/api/sellers";

/**
 * Récupère la liste de tous les vendeurs
 */
export async function fetchSellers() {
  const res = await fetch(BASE_URL);
  if (!res.ok) throw new Error("Erreur lors du chargement des vendeurs");
  return res.json();
}

/**
 * Récupère un vendeur par ID
 */
export async function fetchSeller(id) {
  const res = await fetch(`${BASE_URL}/${id}`);
  if (!res.ok) throw new Error("Erreur lors du chargement du vendeur");
  return res.json();
}

/**
 * Crée un nouveau vendeur
 */
export async function createSeller(data) {
  const res = await fetch(BASE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la création du vendeur");
  return res.json();
}

/**
 * Met à jour un vendeur existant
 */
export async function updateSeller(id, data) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Erreur lors de la mise à jour du vendeur");
  return res.json();
}

/**
 * Supprime un vendeur
 */
export async function deleteSeller(id) {
  const res = await fetch(`${BASE_URL}/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Erreur lors de la suppression du vendeur");
  return res.json();
}
