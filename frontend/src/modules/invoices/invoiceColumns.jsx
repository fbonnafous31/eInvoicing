import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';
import { formatCurrency, formatDate } from '../../utils/formatters/formatters';
import TechnicalStatusCell from './TechnicalStatusCell';
import BusinessStatusCell from './BusinessStatusCell';
import { FaFilePdf } from "react-icons/fa";

export default function useInvoiceColumns(invoiceService, onTechnicalStatusChange, onBusinessStatusChange) {
  const navigate = useNavigate();

  // -------------------- Polling du statut technique --------------------
  const pollStatus = async (invoiceId, interval = 2000, timeout = 60000) => {
    const start = Date.now();
    console.log(`⏱️ Démarrage polling invoice ${invoiceId}`);

    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const statusObj = await invoiceService.getInvoiceStatus(invoiceId);
          console.log(`📡 [Polling] invoice ${invoiceId} status =`, statusObj);

          const technicalStatus = statusObj?.technicalStatus;

          if (["validated", "rejected"].includes(technicalStatus)) {
            console.log(`✅ [Polling] invoice ${invoiceId} statut final atteint :`, technicalStatus);
            resolve(statusObj);
          } else if (Date.now() - start > timeout) {
            console.warn(`⏰ [Polling] invoice ${invoiceId} timeout`);
            reject(new Error("Timeout récupération statut PDP"));
          } else {
            console.log(`🔁 [Polling] invoice ${invoiceId} pas encore final, prochaine vérif dans ${interval}ms`);
            setTimeout(check, interval);
          }
        } catch (err) {
          console.error(`❌ [Polling] invoice ${invoiceId} erreur :`, err);
          reject(err);
        }
      };
      check();
    });
  };

  // -------------------- Colonnes du tableau --------------------
  return [
{
  name: 'Voir / Modifier / PDF ',
  cell: row => (
    <div className="d-flex align-items-center gap-2">
      {/* Voir */}
      <button
        className="btn btn-sm btn-link p-0 m-0 align-middle text-decoration-none"
        onClick={() => row?.id && navigate(`/invoices/${row.id}/view`)}
        title="Consulter la facture"
      >
        👁️
      </button>

      {/* Modifier */}
      <button
        className="btn btn-sm btn-link p-0 m-0 align-middle text-decoration-none"
        onClick={() => row?.id && navigate(`/invoices/${row.id}`)}
        title="Modifier la facture"
      >
        ✏️
      </button>

      {/* Générer PDF */}
      <button
        className="btn btn-sm btn-link p-0 m-0 align-middle text-decoration-none"
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

      {/* PDF/A-3 */}
      <button
        className="btn btn-sm btn-link p-0 m-0 align-middle"
        title="Voir le PDF/A-3 de la facture"
        onClick={() => {
          if (!row?.id) return;
          const pdfUrl = `http://localhost:3000/pdf-a3/${row.id}_pdf-a3.pdf`;
          window.open(pdfUrl, "_blank");
        }}
      >
        <FaFilePdf size={18} color="red" style={{ position: "relative", top: "-2px" }} />
      </button>
    </div>
  ),
  ignoreRowClick: true,
  width: '180px',
}
,
    {
      name: 'Envoyer / Statut',
      cell: row => (
        <div className="flex gap-1 justify-end">
          {/* Bouton envoi facture */}
          <button
            className="btn btn-sm"
            title="Envoyer la facture"
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

                alert("Facture transmise.");

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

          {/* Bouton rafraîchir statut métier */}
          <button
            className="btn btn-sm"
            title={
              !["received", "validated"].includes(row.technical_status)
                ? "Impossible de rafraîchir : statut PDP non reçu ou validé"
                : "Rafraîchir le cycle de vie métier"
            }
            style={{
              pointerEvents: !["received", "validated"].includes(row.technical_status) ? "none" : "auto",
              opacity: !["received", "validated"].includes(row.technical_status) ? 0.6 : 1,
            }}
            onClick={async () => {
              if (!row?.id) return;

              try {
                console.log("🔄 Demande rafraîchissement cycle métier invoice id:", row.id);
                await invoiceService.refreshInvoiceLifecycle(row.id);

                // ⚡ Récupération du dernier statut
                const lifecycle = await invoiceService.getInvoiceLifecycle(row.id);
                const lastStatusRaw = lifecycle?.lifecycle?.[lifecycle.lifecycle.length - 1];
                if (!lastStatusRaw) return;

                console.log(`📤 Nouveau statut métier pour invoice ${row.id}: ${lastStatusRaw.label}`);
                onBusinessStatusChange?.(row.id, lastStatusRaw.code, lastStatusRaw.label);

              } catch (err) {
                console.error("❌ Erreur rafraîchissement cycle métier :", err);
                alert("Erreur lors du rafraîchissement du cycle métier");
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
      name: 'Statut facture',
      selector: row => row.business_status || row.status,
      sortable: true,
      width: '160px',
      cell: row => (
        <BusinessStatusCell
          row={row}
          invoiceService={invoiceService}
          onBusinessStatusChange={onBusinessStatusChange}
        />
      )
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
          onTechnicalStatusChange={onTechnicalStatusChange} // callback du parent
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
