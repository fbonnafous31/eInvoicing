import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';
import { formatCurrency, formatDate } from '../../utils/formatters/formatters';
import { FR } from '../../constants/translations';
import { useInvoiceService } from "@/services/invoices"; 

export default function useInvoiceColumns() {
  const navigate = useNavigate();
  const invoiceService = useInvoiceService();

  return [{
  cell: row => (
        <div className="flex gap-1">
          {/* Voir */}
          <button
            className="btn btn-sm"
            onClick={() => {
              if (row?.id) navigate(`/invoices/${row.id}/view`);
            }}
            title="Consulter la facture"
          >
            👁️
          </button>

          {/* Éditer */}
          <button
            className="btn btn-sm"
            onClick={() => {
              if (row?.id) navigate(`/invoices/${row.id}`);
            }}
            title="Modifier la facture"
          >
            ✏️
          </button>

      {/* Générer PDF */}
          <button
            className="btn btn-sm"
            title="Générer et télécharger la facture (PDF)"
            onClick={async () => {
              if (!row?.id) return;
              try {
                console.log("➡️ Génération PDF pour invoice id:", row.id);

                // 1️⃣ Génération du PDF via service (token inclus)
                const data = await invoiceService.generateInvoicePdf(row.id);
                console.log("📄 Réponse service :", data);

                if (!data?.path) {
                  console.error("❌ Pas de chemin PDF renvoyé");
                  return;
                }

                // 2️⃣ Récupération du PDF via URL backend
                const pdfRes = await fetch(`http://localhost:3000${data.path}`);
                const blob = await pdfRes.blob();

                // 3️⃣ Téléchargement
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = `facture_${row.invoice_number}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);

                console.log("✅ PDF téléchargé");
              } catch (err) {
                console.error("❌ Erreur génération PDF :", err);
              }
            }}
          >
            📄
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: '150px',
    },

    {
      name: 'Référence',
      selector: row => row.invoice_number || '',
      sortable: true,
      width: '150px', 
      cell: row => <EllipsisCell value={row.invoice_number || ''} maxWidth="150px" />
    },
    {
      name: 'Emise le',
      selector: row => row.issue_date ? formatDate(row.issue_date) : '',
      sortable: true,
      width: '100px',
    },
    {
      name: 'Contrat',
      selector: row => row.contract_number || '',
      sortable: true,
      width: '120px',
      cell: row => <EllipsisCell value={row.contract_number || ''} style={{ minWidth: '120px' }} />
    },
    {
      name: 'Commande',
      selector: row => row.purchase_order_number || '',
      sortable: true,
      width: '120px',
      cell: row => <EllipsisCell value={row.purchase_order_number || ''} style={{ minWidth: '120px' }} />
    },
    {
      name: 'Vendeur',
      selector: row => row.seller_legal_name || '',
      sortable: true,
      width: '140px',
      cell: row => <EllipsisCell value={row.seller_legal_name || ''} style={{ minWidth: '150px' }} />
    },
    {
      name: 'Client',
      selector: row => row.client_legal_name || '',
      sortable: true,
      width: '140px',
      cell: row => <EllipsisCell value={row.client_legal_name || ''} style={{ minWidth: '150px' }} />
    },
    {
      name: 'HT',
      selector: row => row.subtotal,
      sortable: true,
      style: { justifyContent: 'flex-end', textAlign: 'right' },
      format: row => formatCurrency(row.subtotal)
    },    
    {
      name: 'TVA',
      selector: row => row.total_taxes,
      sortable: true,
      style: { justifyContent: 'flex-end', textAlign: 'right' },
      format: row => formatCurrency(row.total_taxes)
    },
    {
      name: 'TTC',
      selector: row => row.total,
      sortable: true,
      style: { justifyContent: 'flex-end', textAlign: 'right' },
      format: row => formatCurrency(row.total)
    },    
    {
      name: 'Statut',
      selector: row => row.status || '',
      sortable: true,
      cell: row => (
        <div style={{ textAlign: 'center' }}>
          {FR.status[row.status] || row.status}
        </div>
      )
    },
    {
      name: 'Créé le',
      selector: row => row.created_at ? formatDate(row.created_at) : '',
      sortable: true,
      width: '150px',
    },
    {
      name: 'Modifié le',
      selector: row => row.updated_at ? formatDate(row.updated_at) : '',
      sortable: true,
      width: '150px',
    },
  ];
}
