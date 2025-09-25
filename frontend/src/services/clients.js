import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE = `${window.__ENV__?.VITE_API_URL ?? 'http://localhost:3000'}/api/clients`;

export function useClientService() {
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

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur ${res.status}: ${text}`);
      }

      return res.status === 204 ? true : res.json();
    };

    return {
      fetchClients: () => request(API_BASE),
      fetchClient: (id) => request(`${API_BASE}/${id}`),
      createClient: (data) =>
        request(API_BASE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      updateClient: (id, data) =>
        request(`${API_BASE}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }),
      deleteClient: (id) => request(`${API_BASE}/${id}`, { method: "DELETE" }),
      checkSiret: (siret, clientId = null) => {
        const url = new URL(`${API_BASE}/check-siret/${siret}`);
        if (clientId) url.searchParams.append("id", clientId);
        return request(url.toString());
      },
    };
  }, [getToken]); // dépendance stable
}
