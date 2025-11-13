import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSellerService } from "@/services/sellers";
import { useInvoiceService } from "@/services/invoices";
import { useSellerInfo } from "@/hooks/useSellerInfo";
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
  
  const { sellerPlan, sellerActive, isLoading } = useSellerInfo();
  console.log("Seller plan:", sellerPlan, "Active:", sellerActive);  

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
            className="px-4 py-2 mt-3 rounded-lg bg-blue-600 text-gray-900 hover:bg-blue-700"
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
    code,
    name: s.label,
    count: filteredInvoices.filter(inv => inv.business_status === code).length,
    color: s.color,
  }));

  // Statuts "en cours" pour le graphique
  const activeStatusCodes = ["204", "205", "206", "207", "208", "210"];
  const activeStatusCounts = statusCounts.filter(s => activeStatusCodes.includes(s.code));

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

  // Factures en retard
  const overdueInvoices = filteredInvoices.filter(inv => {
    // 210 = Rejet de la facture
    if (inv.technical_status === 'pending' || inv.business_status === '210') return false;

    const statusCode = parseInt(inv.business_status, 10);
    if (isNaN(statusCode) || statusCode >= 211) return false;

    const dueDate = new Date(inv.issue_date);
    dueDate.setDate(dueDate.getDate() + 30); // délai 30 jours
    return dueDate < new Date();
  }).map(inv => ({
    ...inv,
    due_date: (() => {
      const d = new Date(inv.issue_date);
      d.setDate(d.getDate() + 30);
      return d.toLocaleDateString("fr-FR");
    })()
  }));

  return (
    <div className="container-fluid mt-4" style={{ paddingLeft: '4rem', paddingRight: '4rem' }}>
      <h2 className="mb-4 text-2xl font-bold text-gray-700">
        📈 <span className="text-blue-600">Tableau de bord</span> des factures
      </h2>

      {/* Top clients et montant mensuel */}
      <div className="row mb-4">
        <div className="col-md-6">
          <div
            className="p-3 rounded-xl shadow bg-white flex-fill"
            style={{ height: '360px', minHeight: '192px', overflow: 'auto' }}
          >
            <h4 className="mb-3">🏆 Top 5 clients</h4>
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
            <h4 className="mb-3">💵 Montant facturé par mois</h4>
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

      
      {/* Statuts + Graphique actifs + Factures en retard */}
      {sellerPlan === "pro" && (
        <div className="row d-flex">
          {/* Colonne Statuts */}
          <div className="col-md-4 d-flex">
            <div
              className="p-3 rounded-xl shadow bg-white flex-fill"
              style={{ height: '380px', minHeight: '192px', overflow: 'auto' }}
            >
              <h4 className="mb-3">📊 Statuts des factures</h4>
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
                          style={{ backgroundColor: s.color, cursor: 'pointer' }}
                          onClick={() => navigate(`/invoices?filter=${encodeURIComponent(s.name)}`)}
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

          {/* Colonne Graphique (statuts actifs) */}
          <div className="col-md-4 d-flex">
            <div
              className="p-3 rounded-xl shadow bg-white flex-fill"
              style={{ height: '380px', minHeight: '192px' }}
            >
              <h4 className="mb-4 text-2xl font-bold text-gray-700 flex items-center gap-2">
                🧾 <span className="title-blue">Factures en cours</span>
              </h4>
              <ResponsiveContainer width="100%" height="90%">
                <BarChart data={activeStatusCounts}>
                  <XAxis dataKey="name" tick={false} axisLine={true} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count">
                    {activeStatusCounts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Colonne Factures en retard */}
          <div className="col-md-4 d-flex">
            <div
              className="p-3 rounded-xl shadow bg-white flex-fill"
              style={{ height: '380px', minHeight: '192px', overflow: 'auto' }}
            >
              <h4 className="mb-3">🔴 Factures en retard</h4>
              {overdueInvoices.length === 0 ? (
                <p>Aucune facture en retard !</p>
              ) : (
                <table className="table table-sm mb-0">
                  <thead>
                    <tr>
                      <th>Facture</th>
                      <th>Client</th>
                      <th>Montant</th>
                      <th>Échéance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overdueInvoices.map(inv => (
                      <tr key={inv.id}>
                        <td
                          className="cursor-pointer"
                          onClick={() =>
                            navigate(`/invoices?filter=${encodeURIComponent(inv.invoice_number)}`)
                          }
                        >
                          {inv.business_status && BUSINESS_STATUSES[inv.business_status] && (
                          <span
                            className="px-2 py-1 rounded text-white"
                            style={{
                              backgroundColor: BUSINESS_STATUSES[inv.business_status].color,
                              color: BUSINESS_STATUSES[inv.business_status].color, 
                            }}
                          >
                            🔗
                          </span>
                          )}
                          <span> . {inv.invoice_number}</span>
                        </td>
                        <td>{inv.client?.legal_name || `${inv.client?.firstname} ${inv.client?.lastname}`}</td>
                        <td>
                          {Number(inv.total).toLocaleString("fr-FR", {
                            style: "currency",
                            currency: "EUR",
                          })}
                        </td>
                        <td>{inv.due_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>        
        </div>
      )}
      {sellerPlan !== "Pro" && (
        <div className="text-center mt-4 text-gray-600">
          Des statistiques détaillées sont réservées au plan <strong>Pro</strong>.
        </div>
      )}      
    </div>
  );
}
