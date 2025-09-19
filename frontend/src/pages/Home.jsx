import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerService } from "@/services/sellers";
import { useInvoiceService } from "@/services/invoices";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BUSINESS_STATUSES } from "@/constants/businessStatuses";

export default function Home() {
  const navigate = useNavigate();
  const { fetchMySeller } = useSellerService();
  const { fetchInvoicesBySeller } = useInvoiceService();
  const [loading, setLoading] = useState(true);
  const [hasSeller, setHasSeller] = useState(false);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const seller = await fetchMySeller();
        if (!seller) {
          setHasSeller(false);
          return;
        }
        setHasSeller(true);
        const data = await fetchInvoicesBySeller(seller.id);
        setInvoices(data);
      } catch (err) {
        console.error(err);
        setHasSeller(false);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [fetchMySeller, fetchInvoicesBySeller]);

  if (loading) return <p>Chargement…</p>;

  if (!hasSeller) {
    return (
      <div className="container mt-5">
        <div className="p-4 rounded-xl shadow bg-white text-center">
          <h2>Bienvenue sur eInvoicing !</h2>
          <p>Avant de commencer, créez votre fiche vendeur pour gérer vos factures.</p>
          <button
            className="px-4 py-2 mt-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            onClick={() => navigate("/sellers/new")}
          >
            Créer ma fiche vendeur
          </button>
        </div>
      </div>
    );
  }

  // Filtrer les factures non payées
  const filteredInvoices = invoices.filter(inv => inv.business_status !== "none");

  // Statuts des factures
  const statusCounts = Object.entries(BUSINESS_STATUSES).map(([code, s]) => ({
    name: s.label,
    count: filteredInvoices.filter(inv => inv.business_status === code).length,
    color: s.color,
  }));

  // Top 5 clients
  const clientTotals = {};
  filteredInvoices.forEach(inv => {
    const name =
      inv.client?.legal_name ||
      `${inv.client?.firstname || ""} ${inv.client?.lastname || ""}`.trim();
    if (name) clientTotals[name] = (clientTotals[name] || 0) + Number(inv.total || 0);
  });
  const topClients = Object.entries(clientTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([client, total]) => ({ client, total }));

  // Montant facturé par mois
  const monthlyTotals = {};
  filteredInvoices.forEach(inv => {
    if (!inv.issue_date) return;
    const month = inv.issue_date.slice(0, 7); // YYYY-MM
    monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(inv.total || 0);
  });
  const monthlyData = Object.entries(monthlyTotals)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  return (
    <div className="container-fluid mt-4 px-2">
      <h2 className="mb-4">Dashboard Factures</h2>

      {/* Top clients et montant mensuel */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div
            className="p-3 rounded-xl shadow bg-white flex-fill"
            style={{ height: '360px', minHeight: '192px', overflow: 'auto' }}
          >
            <h4 className="mb-3">Top 5 clients</h4>
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Montant</th>
                </tr>
              </thead>
              <tbody>
                {topClients.map(c => (
                  <tr key={c.client}>
                    <td>{c.client}</td>
                    <td>
                      {c.total.toLocaleString("fr-FR", {
                        style: "currency",
                        currency: "EUR",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col-md-6">
          <div
            className="p-3 rounded-xl shadow bg-white flex-fill"
            style={{ height: '360px', minHeight: '192px', overflow: 'auto' }}
          >
            <h4 className="mb-3">Montant facturé par mois</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={value =>
                    value.toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR",
                    })
                  }
                />
                <Bar dataKey="total" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Statuts + graphique */}
      <div className="row d-flex">
        {/* Colonne Statuts */}
        <div className="col-md-6 d-flex">
          <div
            className="p-3 rounded-xl shadow bg-white flex-fill"
            style={{ height: '360px', minHeight: '192px', overflow: 'auto' }}
          >
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Nombre</th>
                </tr>
              </thead>
              <tbody>
                {statusCounts.map(s => (
                  <tr key={s.name}>
                    <td>
                      <span
                        className="px-2 py-1 rounded text-white"
                        style={{ backgroundColor: s.color }}
                      >
                        {s.name}
                      </span>
                    </td>
                    <td>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne Graphique */}
        <div className="col-md-6 d-flex">
          <div
            className="p-3 rounded-xl shadow bg-white flex-fill"
            style={{ height: '360px', minHeight: '192px' }}
          >
            <h4 className="mb-3">Visualisation des statuts</h4>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCounts}>
                  <XAxis dataKey="name" tick={false} axisLine={true} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count">
                    {statusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
