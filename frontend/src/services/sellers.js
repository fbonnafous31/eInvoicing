import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE = `${window.__ENV?.VITE_API_URL ?? 'http://localhost:3000'}/api/sellers`;

export function useSellerService() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const request = async (url, options = {}) => {
      const token = await getToken();
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Erreur ${res.status}: ${text}`);
      }

      try {
        return JSON.parse(text);
      } catch {
        return true; // pour les DELETE qui ne renvoient rien
      }
    };

    return {
      fetchMySeller: () => request(`${API_BASE}/me`),
      createSeller: (data) =>
        request(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      updateSeller: (id, data) =>
        request(`${API_BASE}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      deleteSeller: () => request(`${API_BASE}`, { method: "DELETE" }), // supprime le vendeur connecté
      checkIdentifier: (identifier, sellerId) =>
        request(`${API_BASE}/check-identifier?identifier=${identifier}${sellerId ? `&id=${sellerId}` : ''}`),
    };
  }, [getToken]);
}
