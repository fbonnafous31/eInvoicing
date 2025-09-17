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

    return new Promise((resolve, reject) => {
      const check = async () => {
        try {
          const statusObj = await invoiceService.getInvoiceStatus(invoiceId);
          const technicalStatus = statusObj?.technicalStatus;

          if (["validated", "rejected"].includes(technicalStatus)) {
            resolve(statusObj);
          } else if (Date.now() - start > timeout) {
            reject(new Error("Timeout récupération statut PDP"));
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
            disabled={
              // Désactiver uniquement si ce n'est pas un brouillon/pending et pas business_status 208
              row.technical_status &&
              !["draft", "pending"].includes(row.technical_status.toLowerCase()) &&
              row.business_status !== "208"
            }
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
      width: '170px',
    },
    {
      name: 'Envoyer / Statut',
      width: '150px',
      cell: row => {
        const isFinalStatus = ["210", "212"].includes(String(row.business_status));

        const canRefresh =
          !isFinalStatus &&                 // Pas final
          ["received", "validated"].includes(row.technical_status); // Statut PDP valide pour rafraîchir


        const canCash = String(row.business_status) === "211";

        return (
          <div className="flex gap-1 justify-end">
            {/* Bouton envoi facture */}
            <button
              className="btn btn-sm"
              style={{
                background: "transparent",
                border: "none",
                padding: "2px 6px",
                cursor: isFinalStatus ? "not-allowed" : "pointer",
                opacity: isFinalStatus ? 0.5 : 1,
              }}
              title={isFinalStatus ? "Action impossible : statut final" : "Envoyer la facture"}
              disabled={isFinalStatus}
              onClick={async () => {
                if (!row?.id) return;

                try {
                  console.log("📤 Envoi facture id:", row.id);

                  // 1️⃣ Envoi de la facture
                  const res = await invoiceService.sendInvoice(row.id);
                  if (!res.submissionId) {
                    alert("Facture envoyée mais le statut technique ne peut pas être suivi pour l'instant.");
                    console.log(`[InvoiceColumns] Pas de submissionId pour invoice ${row.id}`);
                    return;
                  }
                  console.log(`[InvoiceColumns] Facture ${row.id} envoyée, submissionId:`, res.submissionId);
                  alert("Facture transmise à la plateforme de facturation.");

                  // 2️⃣ Polling du statut technique
                  const finalStatus = await pollStatus(row.id);
                  console.log(`[InvoiceColumns] Technical status final pour invoice ${row.id}:`, finalStatus.technicalStatus);
                  onTechnicalStatusChange?.(row.id, finalStatus.technicalStatus);

                  // 3️⃣ Rafraîchissement du cycle métier (business_status)
                  console.log(`[InvoiceColumns] Récupération cycle métier pour invoice ${row.id}`);
                  const lifecycleResp = await invoiceService.getInvoiceLifecycle(row.id, res.submissionId);
                  const lastStatus = lifecycleResp?.lifecycle?.[lifecycleResp.lifecycle.length - 1];

                  if (lastStatus) {
                    console.log(`[InvoiceColumns] Statut métier actuel pour invoice ${row.id}:`, lastStatus);
                    onBusinessStatusChange?.(
                      row.id,
                      lastStatus.code,   
                      lastStatus.label
                    );
                  } else {
                    console.log(`[InvoiceColumns] Aucun statut métier trouvé pour invoice ${row.id}`);
                  }

                } catch (err) {
                  console.error("❌ Erreur envoi, polling ou rafraîchissement :", err);
                  alert("Impossible de communiquer avec le serveur de facturation, réessayez plus tard.");
                }
              }}
            >
              📧
            </button>

            {/* Bouton rafraîchissement cycle métier */}
            <button
              className="btn btn-sm"
              title={
                !canRefresh
                  ? row.business_status === "212"
                    ? "Facture déjà encaissée"
                    : "Impossible de rafraîchir : statut PDP non reçu ou validé"
                  : "Rafraîchir le cycle de vie métier"
              }
              style={{
                pointerEvents: canRefresh ? "auto" : "none",
                border: "none",
                opacity: canRefresh ? 1 : 0.5,
              }}
              disabled={isFinalStatus || !canRefresh}
              onClick={async () => {
                if (!row?.id) return;

                try {
                  // 1️⃣ On demande au backend de rafraîchir le cycle
                  await invoiceService.refreshInvoiceLifecycle(row.id, row.submission_id);

                  // 2️⃣ On récupère le statut métier exact depuis la DB
                  const lifecycleData = await invoiceService.getInvoiceLifecycle(row.id);
                  const lifecycle = Array.isArray(lifecycleData.lifecycle) ? lifecycleData.lifecycle : [];
                  if (lifecycle.length > 0) {
                    const lastStatusRaw = lifecycle[lifecycle.length - 1];
                    onBusinessStatusChange?.(row.id, lastStatusRaw.code, lastStatusRaw.label);
                  }
                } catch (err) {
                  console.error("❌ Erreur rafraîchissement cycle métier :", err);
                  alert("Impossible de communiquer avec le serveur de facturation, réessayez plus tard.");
                }
              }}
            >
              🔄
            </button>

            {/* Bouton encaissement */}
            <button
              className="btn btn-sm"
              style={{
                background: "transparent",
                border: "none",
                padding: "2px 6px",
                cursor: canCash ? "pointer" : "not-allowed",
                opacity: canCash ? 1 : 0.5,
              }}
              title={canCash ? "Encaisser la facture" : "Encaissement possible uniquement si Paiement transmis"}
              disabled={isFinalStatus || !canCash}
              onClick={async () => {
                if (!row?.id || !canCash) return;

                try {
                  console.log(`💰 Encaissement invoice id: ${row.id}`);

                  // 1️⃣ Appel backend pour marquer la facture comme payée
                  const newStatus = await invoiceService.cashInvoice(row.id);

                  // 2️⃣ Récupération du dernier statut métier directement depuis la réponse
                  const lastStatusRaw = newStatus?.lifecycle?.[newStatus.lifecycle.length - 1];

                  if (lastStatusRaw) {
                    // 3️⃣ Mise à jour immédiate dans le tableau
                    onBusinessStatusChange?.(row.id, lastStatusRaw.code, lastStatusRaw.label);
                    console.log(`[InvoiceColumns] Statut métier mis à jour pour invoice ${row.id}:`, lastStatusRaw);

                    alert("Envoi du statut encaissement à la plateforme de facturation.");
                  } else {
                    console.warn(`[InvoiceColumns] Aucun statut métier trouvé pour invoice ${row.id}`);
                    alert("Facture encaissée, mais pas de statut métier trouvé !");
                  }
                } catch (err) {
                  console.error("❌ Erreur encaissement :", err);
                  alert("Erreur lors de l'encaissement de la facture");
                }
              }}
            >
              💰
            </button>
          </div>
        );
      },
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
      selector: row => row.client?.legal_name || '',
      sortable: true,
      width: '140px',
      cell: row => <EllipsisCell value={row.client?.legal_name || ''} style={{ minWidth: '150px' }} />
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
      cell: row => {
        // Si la facture est rejetée, on force "Non renseigné"
        const status = row.technical_status === "rejected" ? "Non renseigné" : row.business_status;

        // On stocke le statusCode pour lequel on veut le commentaire
        const statusCodeForComment = ["206","207","208","210"].includes(String(row.business_status))
          ? row.business_status
          : null;

        return (
          <BusinessStatusCell
            row={{ ...row, business_status: status }}
            invoiceService={invoiceService}
            onBusinessStatusChange={onBusinessStatusChange}
            getStatusComment={async () => {
              if (!statusCodeForComment) return null;
              try {
                const data = await invoiceService.getInvoiceStatusComment(row.id, statusCodeForComment);
                return data.comment || null;
              } catch (err) {
                console.error(`Erreur récupération commentaire pour invoice ${row.id}:`, err);
                return null;
              }
            }}
          />
        );
      }
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
