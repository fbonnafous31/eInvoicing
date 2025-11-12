import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";

const API_ROOT = import.meta.env.VITE_API_URL; 
const API_BASE = `${API_ROOT}/api/invoices`;

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

  const sendInvoiceMail = useCallback(
    (id, { message, subject, to }) =>
      request(`${API_BASE}/${id}/send-mail`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, subject, to }),
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
            const statusNormalized = data.technicalStatus?.toLowerCase();

            if (["validated", "rejected"].includes(statusNormalized)) {
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

  const refreshInvoiceLifecycle = useCallback(
    (id) =>
      request(`${API_BASE}/${id}/refresh-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    [request]
  );

  const getInvoiceLifecycle = useCallback(
    (id) => request(`${API_BASE}/${id}/lifecycle`),
    [request]
  );

  // Polling métier si besoin
  const pollInvoiceLifecycle = useCallback(
    (invoiceId, interval = 2000, timeout = 20000) =>
      new Promise((resolve, reject) => {
        console.log("⏱️ Start polling lifecycle for invoice", invoiceId);
        const startTime = Date.now();

        const check = async () => {
          try {
            const data = await getInvoiceLifecycle(invoiceId);
            const lifecycle = Array.isArray(data.lifecycle) ? data.lifecycle : [];

            // Facture rejetée → aucun statut métier
            if (lifecycle.length === 0) {
              console.log(`[pollInvoiceLifecycle] Aucun statut métier trouvé pour invoice ${invoiceId} (probablement rejetée)`);
              resolve(null); // <-- on résout avec null au lieu de rejeter
              return;
            }

            const lastStatusRaw = lifecycle[lifecycle.length - 1];
            const lastStatus = {
              status_code: lastStatusRaw.code,
              status_label: lastStatusRaw.label
            };

            // Cas statut final ou timeout
            if ([201, 299].includes(lastStatus.status_code)) {
              resolve(lastStatus);
            } else if (Date.now() - startTime > timeout) {
              reject(new Error("Timeout récupération statut métier"));
            } else {
              setTimeout(check, interval);
            }
          } catch (err) {
            reject(err);
          }
        };

        check();
      }),
    [getInvoiceLifecycle]
  );

  const cashInvoice = useCallback(
    (id) =>
      request(`${API_BASE}/${id}/paid`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }),
    [request]
  );

  const getInvoiceStatusComment = useCallback(
    (invoiceId, statusCode) =>
      request(`${API_BASE}/${invoiceId}/status/${statusCode}/comment`),
    [request]
  );

  const getInvoicePdfA3Url = useCallback(
    async (id) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/${id}/pdf-a3-url`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erreur ${res.status}`);
      }

      const { url } = await res.json();
      return url; 
    },
    [getToken]
  );

  const getInvoicePdfA3Proxy = useCallback(
    async (id) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/${id}/pdf-a3-proxy`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);

      const blob = await res.blob();
      return blob; 
    },
    [getToken]
  );

  const fetchInvoicePdf = useCallback(
    async (invoice) => {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/generate-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(invoice),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur génération PDF: ${res.status} - ${text}`);
      }

      const blob = await res.blob();
      return blob;
    },
    [getToken]
  );

  const downloadInvoicePdf = useCallback(
    async (invoice) => {
      if (!invoice?.id) throw new Error("Invoice missing ID");

      const token = await getToken();
      const res = await fetch(`${API_BASE}/${invoice.id}/generate-pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Erreur génération PDF : ${res.status} - ${text}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const safeInvoiceNumber = invoice.invoice_number
        ? invoice.invoice_number.trim().replace(/[\/\\?%*:|"<>#]/g, "_")
        : invoice.id;

      const link = document.createElement("a");
      link.href = url;
      link.download = `facture_${safeInvoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
    [getToken]
  );

  return {
    API_ROOT,
    fetchInvoicesBySeller,
    fetchInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    generateInvoicePdf,
    sendInvoice,
    sendInvoiceMail,
    getInvoiceStatus,
    pollInvoiceStatusPDP, 
    refreshInvoiceLifecycle,
    getInvoiceLifecycle,
    pollInvoiceLifecycle,
    cashInvoice,
    getInvoiceStatusComment,
    getInvoicePdfA3Url,
    getInvoicePdfA3Proxy,
    fetchInvoicePdf,
    downloadInvoicePdf,
  };
}
