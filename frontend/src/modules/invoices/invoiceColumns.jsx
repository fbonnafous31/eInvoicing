import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';
import { formatCurrency, formatDate } from '../../utils/formatters/formatters';
import { FR } from '../../constants/translations';
import TechnicalStatusCell from './TechnicalStatusCell';

export default function useInvoiceColumns(invoiceService, onTechnicalStatusChange) {
  const navigate = useNavigate();

  // -------------------- Polling du statut technique --------------------
  const pollStatus = async (invoiceId, interval = 2000, timeout = 60000) => {
    const start = Date.now();

    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const statusObj = await invoiceService.getInvoiceStatus(invoiceId);
          console.log(`📡 Polling invoice ${invoiceId} status =`, statusObj);

          const technicalStatus = statusObj?.technicalStatus;
          if (["validated", "rejected"].includes(technicalStatus)) {
            resolve(statusObj);
          } else if (Date.now() - start > timeout) {
            reject(new Error("⏱️ Timeout récupération statut PDP"));
          } else {
            setTimeout(check, interval);
          }
        } catch (err) {
          reject(err);
        }
      };
      check();
    });
  };

  // -------------------- Colonnes du tableau --------------------
  return [
    {
      name: 'Voir / Éditer / PDF',
      cell: row => (
        <div className="flex gap-1">
          <button
            className="btn btn-sm"
            onClick={() => row?.id && navigate(`/invoices/${row.id}/view`)}
            title="Consulter la facture"
          >
            👁️
          </button>
          <button
            className="btn btn-sm"
            onClick={() => row?.id && navigate(`/invoices/${row.id}`)}
            title="Modifier la facture"
          >
            ✏️
          </button>
          <button
            className="btn btn-sm"
            title="Générer et télécharger la facture (PDF)"
            onClick={async () => {
              if (!row?.id) return;
              try {
                const data = await invoiceService.generateInvoicePdf(row.id);
                if (!data?.path) return console.error("❌ Pas de chemin PDF renvoyé");

                const pdfRes = await fetch(`http://localhost:3000${data.path}`);
                const blob = await pdfRes.blob();
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
      name: 'Envoyer / Statut',
      cell: row => (
        <div className="flex gap-1 justify-end">
          <button
            className="btn btn-sm"
            onClick={async () => {
              if (!row?.id) return;
              try {
                console.log("📤 Envoi facture id:", row.id);
                const res = await invoiceService.sendInvoice(row.id);
                console.log("✅ Facture envoyée :", res);

                if (!res.submissionId) {
                  console.warn("⚠️ Pas de submissionId renvoyé, polling impossible");
                  alert("Facture envoyée mais le statut technique ne peut pas être suivi pour l'instant.");
                  return;
                }

                alert("Facture transmise");

                const finalStatus = await pollStatus(row.id);
                console.log("✅ Statut final :", finalStatus);
                onTechnicalStatusChange?.(row.id, finalStatus.technicalStatus);
              } catch (err) {
                console.error("❌ Erreur envoi ou polling :", err);
                alert("Erreur lors de l'envoi ou du polling du statut");
              }
            }}
          >
            📧
          </button>

          <button
            className="btn btn-sm"
            title="Récupérer le statut de la facture"
            onClick={async () => {
              if (!row?.id) return;
              try {
                const status = await invoiceService.getInvoiceStatus(row.id);
                console.log("ℹ️ Statut reçu :", status);
                alert(`Statut actuel : ${status.technicalStatus}`);
              } catch (err) {
                console.error("❌ Erreur récupération statut :", err);
                alert("Erreur lors de la récupération du statut");
              }
            }}
          >
            🔄
          </button>
        </div>
      ),
      ignoreRowClick: true,
      width: '140px',
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
      cell: row => <div style={{ textAlign: 'center' }}>{FR.status[row.status] || row.status}</div>
    },
    {
      name: 'Statut PDP',
      selector: row => row.technical_status || '',
      sortable: true,
      width: '120px',
      cell: row => (
        <TechnicalStatusCell
          row={row}
          invoiceService={invoiceService}
          onTechnicalStatusChange={onTechnicalStatusChange}
        />
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
    }
  ];
}
