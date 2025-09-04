// frontend/src/components/invoices/InvoiceForm.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InvoiceHeader from "./InvoiceHeader";
import InvoiceClient from "./InvoiceClient";
import InvoiceLines from "./InvoiceLines";
import TaxBases from "./TaxBases";
import SupportingDocs from "./SupportingDocs";
import FormSection from "../form/FormSection";
import { createInvoice, updateInvoice } from "../../services/invoices";
import { fetchSellers } from '../../services/sellers';
import { generateInvoicePdf } from "../../services/invoices";
import { validateInvoiceField, validateClientData } from "../../utils/validators/invoice";
import { EditButton, CancelButton, DeleteButton, SaveButton } from '@/components/ui/buttons';

export default function InvoiceForm({ initialData, onDelete = () => {}, readOnly = false }) {

  const navigate = useNavigate();
  const [invoiceData, setInvoiceData] = useState({
    header: {
      // Initialiser la date d'émission à aujourd'hui et l'année fiscale correspondante
      issue_date: new Date().toISOString().split("T")[0], 
      fiscal_year: new Date().getFullYear(),
      payment_terms: "30_df",
    },
    client: {},
    lines: [],
    taxes: [],
    seller: [],
    attachments: [],
  });
  const [isEditing, setIsEditing] = useState(!initialData && !readOnly);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [headerTouched, setHeaderTouched] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchFullInvoiceData = async () => {
      if (!initialData) return;

      let seller = {};
      if (initialData.header?.seller_id) {
        try {
          seller = await fetchSellers(initialData.header.seller_id);
        } catch (err) {
          console.error("Erreur fetch seller:", err);
        }
      }
      console.log("Seller:", seller);


      const safeData = {
        ...initialData,
        lines: (initialData.lines || []).map(line => ({
          ...line,
          quantity: Number(line.quantity || 0),
          unit_price: Number(line.unit_price || 0),
          discount: Number(line.discount || 0),
          vat_rate: Number(line.vat_rate || 0),
        })),
        taxes: (initialData.taxes || []).map(tax => ({
          ...tax,
          base_amount: Number(tax.base_amount || 0),
          tax_amount: Number(tax.tax_amount || 0),
          vat_rate: Number(tax.vat_rate || 0),
        })),
        seller,
      };

      setInvoiceData(safeData);
    };

    fetchFullInvoiceData();
  }, [initialData]);

  console.log("InvoiceForm invoiceData:", invoiceData);

  const headerFields = ["invoice_number", "issue_date", "fiscal_year", "seller_id"];

  // Calcul des totaux et TVA
  const { subtotal, totalTaxes, total, linesWithTotals, taxesSummary } = useMemo(() => {
    let st = 0, tt = 0;
    const taxesMap = {};

    const newLines = invoiceData.lines.map(line => {
      const quantity = Number(line.quantity) || 0;
      const unit_price = Number(line.unit_price) || 0;
      const discount = Number(line.discount) || 0;
      const vat_rate = Number(line.vat_rate) || 0;

      const line_net = quantity * unit_price - discount;
      const line_tax = (line_net * vat_rate) / 100;
      const line_total = line_net + line_tax;

      st += line_net;
      tt += line_tax;

      if (vat_rate > 0) {
        if (!taxesMap[vat_rate]) taxesMap[vat_rate] = { vat_rate, base_amount: 0, tax_amount: 0 };
        taxesMap[vat_rate].base_amount += line_net;
        taxesMap[vat_rate].tax_amount += line_tax;
      }

      return { ...line, quantity, unit_price, discount, vat_rate, line_net, line_tax, line_total };
    });

    return {
      subtotal: st,
      totalTaxes: tt,
      total: st + tt,
      linesWithTotals: newLines,
      taxesSummary: Object.values(taxesMap)
    };
  }, [invoiceData.lines]);

  const handleChange = (section, value) => {
    // Si value est null, réinitialiser la section à un objet vide
    const newData = { ...invoiceData, [section]: value || {} };
    setInvoiceData(newData);

    // Validation dynamique
    if (section === "header") {
      const newErrors = { ...errors };
      headerFields.forEach(f => {
        const err = validateInvoiceField(f, newData.header[f], newData.header);
        if (err) newErrors[f] = err;
        else delete newErrors[f];
      });
      setErrors(newErrors);
    }
    if (section === "client") {
      const newErrors = { ...errors };
      Object.keys(value || {}).forEach(f => {
        const err = validateClientData(f, newData.client);
        if (err) newErrors[f] = err;
        else delete newErrors[f];
      });
      setErrors(newErrors);
    }
  };

  const validateAll = () => {
    const headerErrors = {};
    headerFields.forEach(f => {
      const err = validateInvoiceField(f, invoiceData.header[f], invoiceData.header);
      if (err) headerErrors[f] = err;
    });
    setErrors(prev => ({ ...prev, ...headerErrors }));
    return headerErrors;
  };

  const validateClient = () => {
    const clientErrors = {};
    const clientFields = [
      "client_first_name",
      "client_last_name",
      "client_address",
      "client_siret",
      "client_vat_number",
      "client_legal_name"
    ];
    clientFields.forEach(f => {
      const err = validateClientData(f, invoiceData.client);
      if (err) clientErrors[f] = err;
    });
    setErrors(prev => ({ ...prev, ...clientErrors }));
    return clientErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setErrorMessage("");

    const headerErrors = validateAll();
    setHeaderTouched(headerFields.reduce((acc, f) => ({ ...acc, [f]: true }), {}));
    if (Object.keys(headerErrors).length > 0) {
      setErrorMessage("Certains champs obligatoires sont manquants !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Validation client
    const clientEmpty = !invoiceData.client || Object.keys(invoiceData.client).length === 0;
    if (clientEmpty) {
      setErrorMessage("Vous devez renseigner les informations du client !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const clientErrors = validateClient();
    if (Object.keys(clientErrors).length > 0) {
      setErrorMessage("Certains champs client sont obligatoires !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!invoiceData.lines.length) {
      setErrorMessage("Vous devez ajouter au moins une ligne de facture !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const mainCount = invoiceData.attachments.filter(a => a.attachment_type === 'main').length;
    if (mainCount !== 1) {
      setErrorMessage("La facture doit avoir un justificatif principal");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const mainAttachment = invoiceData.attachments.find(a => a.attachment_type === 'main');
    const shouldGeneratePdf = mainAttachment?.generated === true;
    if (mainAttachment.raw_file && mainAttachment.raw_file.type !== "application/pdf") {
      setErrorMessage("Le justificatif principal doit être un fichier PDF !");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      const formData = new FormData();

      const newAttachments = invoiceData.attachments.filter(a => a.raw_file);
      newAttachments.forEach(file => {
        formData.append("attachments", file.raw_file);
      });

      const newAttachmentsMeta = newAttachments.map(a => ({attachment_type: a.attachment_type}));
      formData.append("attachments_meta", JSON.stringify(newAttachmentsMeta));

      if (initialData) {
        const existingAttachments = invoiceData.attachments.filter(a => !a.raw_file);
        formData.append("existing_attachments", JSON.stringify(existingAttachments));
      }

      formData.append("invoice", JSON.stringify({
        invoice_number: invoiceData.header.invoice_number,
        issue_date: invoiceData.header.issue_date,
        fiscal_year: invoiceData.header.fiscal_year,
        seller_id: invoiceData.header.seller_id,
        contract_number: invoiceData.header.contract_number || null,
        purchase_order_number: invoiceData.header.purchase_order_number || null,
        payment_terms: invoiceData.header.payment_terms || null,
        client_id: invoiceData.client.client_id || null,
        supply_date: invoiceData.header.supply_date || null
      }));

      formData.append("client", JSON.stringify(invoiceData.client));
      formData.append("lines", JSON.stringify(linesWithTotals));
      formData.append("taxes", JSON.stringify(taxesSummary));
      console.log("Payload FormData ready:", formData);

      if (shouldGeneratePdf) {
        try {
          const { path } = await generateInvoicePdf(invoiceData.id);

          // Télécharger automatiquement le PDF
          const link = document.createElement("a");
          link.href = path;
          link.download = `facture_${invoiceData.header.invoice_number}.pdf`;
          link.click();

          setSuccessMessage("Facture créée et PDF généré avec succès ! 🎉");
        } catch (err) {
          console.error("❌ Erreur génération PDF:", err);
          setErrorMessage("Impossible de générer le PDF : " + err.message);
        }
      } else {
        if (initialData) {
          // Mise à jour
          if (isDraft) {
            await updateInvoice(initialData.id, formData);
            setSuccessMessage("Facture mise à jour avec succès ! 🎉");
          } else {
            // Ce cas ne devrait pas être possible via l'UI, mais c'est une sécurité
            setErrorMessage("Impossible de modifier une facture qui n'est pas un brouillon.");
            return;
          }
        } else {
          // Création
          await createInvoice(formData);
          setSuccessMessage("Facture créée avec succès ! 🎉");
        }
      } 

      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => {
        setSuccessMessage("");
        navigate("/invoices");
      }, 2000);

    } catch (err) {
      setErrorMessage(err.message || "Erreur lors de la création de la facture");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const [openSections, setOpenSections] = useState({
    header: true,
    client: true,
    contract: true,
    lines: true,
    taxes: true,
    attachments: true
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sectionHasError = (fields) => {
    const currentErrors = errors;
    return fields.some(f => currentErrors[f]);
  };

  const isDraft = useMemo(() => {
    const status = initialData?.status;
    if (!status) return false;
    return status.toString().trim().toLowerCase() === "draft";
  }, [initialData]);

  return (
    <form onSubmit={handleSubmit}>
      {successMessage && <div className="alert alert-success">{successMessage}</div>}
      {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

      <InvoiceHeader
        data={invoiceData.header}
        onChange={val => handleChange("header", val)}
        disabled={!isEditing}
        submitted={submitted}
        errors={errors}
        touchedFields={headerTouched}
        setTouchedFields={setHeaderTouched}
      />

      <FormSection
        title="Client"
        sectionKey="client"
        openSections={openSections}
        toggleSection={toggleSection}
        hasError={sectionHasError([
          "client_first_name",
          "client_last_name",
          "client_address",
          "client_siret",
          "client_vat_number",
          "client_legal_name"
        ])}
      >
        <InvoiceClient
          value={invoiceData.client}
          onChange={val => handleChange("client", val)}
          disabled={!isEditing}
          submitted={submitted}
          errors={errors}
        />
      </FormSection>

      <InvoiceLines
        data={linesWithTotals}
        onChange={val => handleChange("lines", val)}
        hideLabelsInView={readOnly}
        disabled={!isEditing}
      />

      <TaxBases
        data={taxesSummary}
        onChange={val => handleChange("taxes", val)}
        hideLabelsInView={readOnly}
        disabled={!isEditing}
      />

      <SupportingDocs
        data={invoiceData.attachments}
        onChange={val => handleChange("attachments", val)}
        disabled={!isEditing}
        hideLabelsInView={readOnly}
        allowPrincipal
      />

      <div className="card p-3 mb-3">
        <h5>Récapitulatif</h5>
        <p>Montant HT : {subtotal.toFixed(2)} €</p>
        <p>Total TVA : {totalTaxes.toFixed(2)} €</p>
        <p>Total TTC : {total.toFixed(2)} €</p>
      </div>

      <div className="mt-4 mb-5 d-flex justify-content-end gap-2">
        {!readOnly && (
          <>
            {initialData ? (
              <>
                {isDraft && (
                  !isEditing ? (
                    <>
                      <EditButton onClick={() => setIsEditing(true)}>Modifier</EditButton>
                      <DeleteButton onClick={onDelete} />
                    </>
                  ) : (
                    <>
                      <CancelButton onClick={() => setIsEditing(false)} />
                      <SaveButton />
                    </>
                  )
                )}
              </>
            ) : (
              <button type="submit" className="btn btn-primary">Créer la facture</button>
            )}
          </>
        )}
      </div>

    </form>
  );
}