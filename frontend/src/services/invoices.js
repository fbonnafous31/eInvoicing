import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_BASE = "http://localhost:3000/api/invoices";

export function useInvoiceService() {
  const { getToken } = useAuth();

  const request = useCallback(
    async (url, options = {}) => {
      const token = await getToken();
      const res = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || `Erreur ${res.status}`);
      }

      return res.status === 204 ? true : res.json();
    },
    [getToken]
  );

  const fetchInvoicesBySeller = useCallback(() => request(API_BASE), [request]);
  const fetchInvoice = useCallback((id) => request(`${API_BASE}/${id}`), [request]);
  const createInvoice = useCallback(
    (formData) => request(API_BASE, { method: "POST", body: formData }),
    [request]
  );
  const updateInvoice = useCallback(
    (id, formData) => request(`${API_BASE}/${id}`, { method: "PUT", body: formData }),
    [request]
  );
  const deleteInvoice = useCallback(
    (id) => request(`${API_BASE}/${id}`, { method: "DELETE" }),
    [request]
  );
  const generateInvoicePdf = useCallback(
    (id) =>
      request(`${API_BASE}/${id}/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    [request]
  );
  const sendInvoice = useCallback(
    (id) =>
      request(`${API_BASE}/${id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    [request]
  );
  
  const getInvoiceStatus = useCallback((id) => request(`${API_BASE}/${id}/status`), [request]);

  // Polling pour le statut PDP
  const pollInvoiceStatusPDP = useCallback(
    (submissionId, interval = 2000, timeout = 20000) =>
      new Promise((resolve, reject) => {
        const startTime = Date.now();

        const checkStatus = async () => {
          try {
            const data = await request(`${API_BASE}/pdp-status/${submissionId}`);
            if (["validated", "rejected"].includes(data.technicalStatus)) {
              resolve(data);
            } else if (Date.now() - startTime > timeout) {
              reject(new Error("Timeout récupération statut PDP"));
            } else {
              setTimeout(checkStatus, interval);
            }
          } catch (err) {
            reject(err);
          }
        };

        checkStatus();
      }),
    [request]
  );

  return {
    fetchInvoicesBySeller,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoicePdf,
    sendInvoice,
    getInvoiceStatus,
    pollInvoiceStatusPDP, 
  };
}
