import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE = "http://localhost:3000/api/sellers";

export function useSellerService() {
  const { getToken } = useAuth();

  return useMemo(() => {
    const request = async (url, options = {}) => {
      console.log("[Service] → request URL:", url);
      console.log("[Service] → options avant token:", options);

      const token = await getToken();
      console.log("[Service] → token obtenu:", token?.substring(0, 10) + "..."); // on ne log pas tout

      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("[Service] ← status:", res.status, res.statusText);

      const text = await res.text();
      console.log("[Service] ← raw response text:", text);

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
      updateSeller: (data) =>
        request(`${API_BASE}`, { // on met à jour le vendeur connecté
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
