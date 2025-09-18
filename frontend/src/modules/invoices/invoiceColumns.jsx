import React from 'react';
import { useNavigate } from 'react-router-dom';
import EllipsisCell from '../../components/common/EllipsisCell';
import { formatCurrency, formatDate } from '../../utils/formatters/formatters';
import TechnicalStatusCell from './TechnicalStatusCell';
import BusinessStatusCell from './BusinessStatusCell';
import { FaFilePdf } from "react-icons/fa";
import { canSendInvoice } from '../../utils/businessRules/invoiceStatus';
export default function useInvoiceColumns(invoiceService, onTechnicalStatusChange, onBusinessStatusChange, onInvoiceUpdate) {
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
      style: { textAlign: 'left', paddingLeft: '20px' },
      ignoreRowClick: true,
      width: '150px',      
      cell: row => (
        // console.log("Rendering action cell for row:", row),
        <div className="d-flex justify-content-end align-items-center gap-2">
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
    },
    {
      name: 'Envoyer / Statut',
      style: { textAlign: 'left', paddingLeft: '20px' },
      width: '150px',
      cell: row => {
        const isFinalStatus = ["210", "212"].includes(String(row.business_status));
        const canSend = canSendInvoice(row);

        const canRefresh =
          !isFinalStatus &&                
          ["received", "validated"].includes(row.technical_status); 


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
                cursor: canSend ? "pointer" : "not-allowed",
                opacity: canSend ? 1 : 0.5,
              }}
              title={canSend ? "Envoyer la facture" : "Action impossible : statut non valide"}
              disabled={!canSend}
              onClick={async () => {
                if (!row?.id || !canSend) return;

                try {
                  console.log("📤 [Envoyer] Début envoi facture id:", row.id);

                  // 1️⃣ Envoi de la facture au PDP
                  const res = await invoiceService.sendInvoice(row.id);
                  if (!res.submissionId) {
                    console.warn(`[Envoyer] Facture ${row.id} envoyée mais pas de submissionId pour suivi`);
                    alert("Facture envoyée mais le statut technique ne peut pas être suivi pour l'instant.");
                    return;
                  }
                  console.log(`[Envoyer] Facture ${row.id} envoyée, submissionId:`, res.submissionId);
                  alert("Facture transmise à la plateforme de facturation.");

                  // 2️⃣ Polling du statut technique jusqu'au statut final
                  console.log(`[Envoyer] Démarrage polling statut technique pour invoice ${row.id}`);
                  const finalStatus = await pollStatus(row.id);
                  console.log(`[Envoyer] Statut technique final pour invoice ${row.id}:`, finalStatus.technicalStatus);
                  onTechnicalStatusChange?.(row.id, finalStatus.technicalStatus);

                  // 3️⃣ Récupération du dernier statut métier depuis le backend
                  console.log(`[Envoyer] Récupération cycle métier pour invoice ${row.id}`);
                  const lifecycleResp = await invoiceService.getInvoiceLifecycle(row.id, res.submissionId);
                  const lifecycle = Array.isArray(lifecycleResp.lifecycle) ? lifecycleResp.lifecycle : [];
                  const lastStatus = lifecycle[lifecycle.length - 1];

                  if (lastStatus) {
                    console.log(`[Envoyer] Statut métier actuel pour invoice ${row.id}:`, lastStatus);

                    // 4️⃣ Mise à jour immédiate via callback parent
                    onBusinessStatusChange?.(row.id, lastStatus.code, lastStatus.label);
                    console.log(`[Envoyer] Ligne mise à jour pour invoice ${row.id}`);
                  } else {
                    console.warn(`[Envoyer] Aucun statut métier trouvé pour invoice ${row.id}`);
                  }
                } catch (err) {
                  console.error("❌ [Envoyer] Erreur envoi / polling / refresh :", err);
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
      // 1️⃣ On demande au backend de rafraîchir le cycle PDP si nécessaire
      await invoiceService.refreshInvoiceLifecycle(row.id, row.submission_id);

      // 2️⃣ On récupère la facture complète depuis la DB
      const invoice = await invoiceService.fetchInvoice(row.id);
      if (!invoice) return;

      // ⚡ Met à jour le cycle métier
      const lifecycle = Array.isArray(invoice.lifecycle) ? invoice.lifecycle : [];
      if (lifecycle.length > 0) {
        const lastStatusRaw = lifecycle[lifecycle.length - 1];
        onBusinessStatusChange?.(row.id, lastStatusRaw.code, lastStatusRaw.label);
      }

      // ⚡ Met à jour le statut principal / technique pour le front (activation boutons)
      onInvoiceUpdate?.(invoice); // <-- callback à définir dans ton state pour mettre à jour la ligne
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

                  // Appel backend pour marquer la facture comme payée
                  const res = await invoiceService.cashInvoice(row.id);

                  // Mise à jour immédiate côté front
                  if (res?.newStatus) {
                    onBusinessStatusChange?.(row.id, res.newStatus.code, res.newStatus.label);
                    console.log(`[InvoiceColumns] Facture ${row.id} encaissée, statut:`, res.newStatus);
                  }

                  alert("Encaissement effectué !");
                } catch (err) {
                  console.error("❌ Erreur encaissement :", err);
                  alert("Impossible de communiquer avec le serveur, réessayez plus tard.");
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
      style: { textAlign: 'center' },
      cell: row => <div style={{ textAlign: 'center' }}>{formatCurrency(row.subtotal)}</div>
    },
    {
      name: 'TVA',
      selector: row => row.total_taxes,
      sortable: true,
      style: { textAlign: 'center' },
      cell: row => <div style={{ textAlign: 'center' }}>{formatCurrency(row.total_taxes)}</div>
    },

    {
      name: 'TTC',
      selector: row => row.total,
      sortable: true,
      style: { textAlign: 'center' },
      cell: row => <div style={{ textAlign: 'center' }}>{formatCurrency(row.total)}</div>
    },
    {
      name: 'Statut facture',
      selector: row => row.business_status || row.status,
      sortable: true,
      width: '160px',
      cell: row => {
        // Déterminer le statut affiché : si la facture est rejetée côté technique, afficher "Non renseigné"
        const displayedStatus = row.technical_status === "rejected" ? "Non renseigné" : row.business_status;

        // Liste des codes pour lesquels on souhaite récupérer un commentaire
        const statusCodesWithComment = ["206", "207", "208", "210"];
        const statusCodeForComment = statusCodesWithComment.includes(String(row.business_status))
          ? row.business_status
          : null;

        return (
          <BusinessStatusCell
            row={{ ...row, business_status: displayedStatus }}
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
      style: { textAlign: 'left', paddingLeft: '20px' },
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
