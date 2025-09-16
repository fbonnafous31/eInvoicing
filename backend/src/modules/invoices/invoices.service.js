// invoices.service.js
const FormData = require('form-data');
const InvoicesModel = require('./invoices.model');
const { generateFacturXXML } = require('../../utils/facturx-generator');
const { embedFacturXInPdf } = require('../../utils/pdf-generator');
const InvoicesAttachmentsModel = require('./invoiceAttachments.model');
const SellersModel = require('../sellers/sellers.service');
const ClientsModel = require('../clients/clients.service'); 
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const FACTURX_DIR = path.resolve('src/uploads/factur-x');

function prepareClientForXML(client) {
  if (!client) return {};
  return {
    legal_name: client.legal_name || `${client.client_legal_name || ''}`.trim(),
    address: client.address || client.client_address,
    city: client.city || client.client_city,
    postal_code: client.postal_code || client.client_postal_code,
    country_code: client.country_code || client.client_country_code,
    email: client.email || client.client_email,
    phone: client.phone || client.client_phone,
  };
}

function saveFacturXXML(id, invoiceData) {
  if (!fs.existsSync(FACTURX_DIR)) {
    fs.mkdirSync(FACTURX_DIR, { recursive: true });
  }
  const xml = generateFacturXXML(invoiceData);
  const xmlPath = path.join(FACTURX_DIR, `${id}-factur-x.xml`);
  fs.writeFileSync(xmlPath, xml, 'utf-8');
  return xmlPath;
}

async function getMainPdfPath(invoiceId) {
  const attachment = await InvoicesAttachmentsModel.getAttachment(invoiceId, 'main');
  if (!attachment) throw new Error(`PDF principal introuvable pour invoice ${invoiceId}`);
  return path.resolve(attachment.file_path); 
}

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

async function getInvoice(id) {
  const invoice = await InvoicesModel.getInvoiceById(id);
  return invoice || null;
}

async function createInvoice(data) {
  const { invoice, client, lines, taxes, attachments } = data;
  const createdInvoice = await InvoicesModel.createInvoice({ invoice, client, lines, taxes, attachments });
  console.log("✅ Invoice created, id:", createdInvoice.id);

  const clientForXML = prepareClientForXML(createdInvoice.client);

  const xmlPath = saveFacturXXML(createdInvoice.id, {
    header: invoice,
    seller: createdInvoice.seller,
    client: clientForXML,
    lines,
    taxes,
    attachments,
  });

  console.log("📄 Factur-X saved at:", xmlPath);

  const mainPdfPath = await InvoicesAttachmentsModel.getAttachment(createdInvoice.id, 'main');
  if (!mainPdfPath) throw new Error(`PDF principal introuvable pour invoice ${createdInvoice.id}`);
  
  const additionalAttachments = await InvoicesAttachmentsModel.getAdditionalAttachments(createdInvoice.id);
  const pdfA3Path = await embedFacturXInPdf(mainPdfPath.file_path, xmlPath, additionalAttachments, createdInvoice.id);

  console.log("📄 PDF/A-3 generated at:", pdfA3Path);

  return { ...createdInvoice, facturxPath: xmlPath, pdfPath: pdfA3Path };
}

async function updateInvoice(id, data) {
  const { invoice, client, lines, taxes, attachments } = data;

  console.log("=== updateInvoice called for id:", id, "===");

  const updatedInvoice = await InvoicesModel.updateInvoice(id, {
    invoice,
    client,
    lines,
    taxes,
    newAttachments: attachments,
    existingAttachments: []
  });
  console.log("✅ Invoice updated, updatedInvoice:", updatedInvoice);

  const clientForXML = prepareClientForXML(updatedInvoice.client);

  let xmlPath = null;
  let pdfA3Path = null;

  // -------------------- Génération XML --------------------
  if (!invoice || !invoice.invoice_number || !lines || lines.length === 0 || !taxes || taxes.length === 0) {
      console.warn(`⚠️ Facture ${id} incomplète, XML non généré`);
  } else {
      try {
          xmlPath = saveFacturXXML(id, {
              header: invoice,
              seller: updatedInvoice.seller,
              client: clientForXML,
              lines,
              taxes,
              attachments,
          });
          console.log("📄 Factur-X saved at:", xmlPath);
      } catch (err) {
          console.error(`❌ Erreur génération XML pour invoice ${id}:`, err);
      }
  }

  // -------------------- Génération PDF/A-3 --------------------
  if (updatedInvoice.technical_status === 'rejected') {
      console.warn(`⚠️ Facture ${id} rejetée, PDF/A-3 non généré`);
  } else if (!xmlPath) {
      console.warn(`⚠️ XML non généré pour invoice ${id}, PDF/A-3 non généré`);
  } else {
      try {
          let mainPdfPath;
          try {
              mainPdfPath = await getMainPdfPath(updatedInvoice.id);
          } catch (err) {
              console.warn(`⚠️ Pas de PDF principal pour invoice ${updatedInvoice.id}, skipping PDF/A-3`);
          }

          if (mainPdfPath) {
              const additionalAttachments = await InvoicesAttachmentsModel.getAdditionalAttachments(updatedInvoice.id);
              pdfA3Path = await embedFacturXInPdf(mainPdfPath, xmlPath, additionalAttachments, updatedInvoice.id);
              console.log("📄 PDF/A-3 generated at:", pdfA3Path);
          }
      } catch (err) {
          console.error(`❌ Erreur génération PDF/A-3 pour invoice ${id}:`, err);
      }
  }

  return { ...updatedInvoice, facturxPath: xmlPath, pdfPath: pdfA3Path };
}

async function deleteInvoice(id) {
  return await InvoicesModel.deleteInvoice(id);
}


async function registerGeneratedPdf(invoiceId, pdfPath) {
  const fileName = pdfPath.split('/').pop(); // ex: facture_174.pdf

  const attachment = {
    file_name: fileName,
    file_path: pdfPath,
    attachment_type: 'main',
    generated: true
  };

  await saveAttachment(invoiceId, attachment);
  return attachment;
}

async function getInvoicesBySeller(sellerId) {
  return await InvoicesModel.getInvoicesBySeller(sellerId);
}

axios.interceptors.request.use(request => {
  let dataInfo = request.data;

  if (dataInfo instanceof FormData) {
    const fileField = dataInfo._streams?.find(stream => stream.includes('filename="'));
    const fileNameMatch = fileField?.match(/filename="(.+?)"/);
    const fileName = fileNameMatch ? fileNameMatch[1] : 'unknown';
    dataInfo = { file: fileName };
  }

  console.log('📤 Axios envoi :', {
    url: request.url,
    method: request.method,
    headers: request.headers,
    data: dataInfo
  });

  return request;
});

const PDP_URL = 'http://localhost:4000/invoices'; // endpoint simulé
async function sendInvoice(invoiceId) {
  const facturXPath = path.join(FACTURX_DIR, `${invoiceId}-factur-x.xml`);
  if (!fs.existsSync(facturXPath)) {
    throw new Error(`Factur-X non trouvé pour invoice ${invoiceId}`);
  }

  const fileStats = fs.statSync(facturXPath);
  const fileName = path.basename(facturXPath);

  // 🔹 Récupérer la facture complète avec seller et client
  const invoice = await InvoicesModel.getInvoiceById(invoiceId);
  if (!invoice) throw new Error(`Facture ${invoiceId} introuvable`);

  const sellerId = invoice.seller_id;
  const clientId = invoice.client_id;

  // 🔹 Récupérer seller et client depuis la DB
  const seller = await SellersModel.getSellerById(sellerId);
  const client = await ClientsModel.getClientById(clientId);

  // 🔹 Construire les métadatas réalistes
  const metadata = {
    senderId: seller?.legal_identifier || seller?.id || 'unknown',
    receiverId: client?.legal_identifier || client?.siret || client?.id || 'unknown',
    invoiceId: invoice.invoice_number
  };

  // 🔹 Construire le FormData avec Factur-X et métadatas
  const form = new FormData();
  form.append('invoice', fs.createReadStream(facturXPath));
  form.append('metadata', JSON.stringify(metadata));

  // 🔹 Logging léger avant envoi
  console.log(`📤 Envoi facture ${invoiceId} au PDP avec :`, {
    fileName,
    size: fileStats.size,
    metadata
  });

  const response = await axios.post(PDP_URL, form, {
    headers: {
      ...form.getHeaders()
    }
  });

  const { status: initialStatus, submissionId } = response.data;

  // ⚡ Mettre à jour immédiatement le statut technique
  await InvoicesModel.updateTechnicalStatus(invoiceId, { technicalStatus: initialStatus, submissionId });

  console.log(`✅ Facture ${invoiceId} envoyée :`, response.data);

  // 🔹 Lancer le polling pour suivre la facture jusqu'au statut final
  pollInvoiceStatusPDP(invoiceId, submissionId);

  return {
    invoiceId,
    filename: fileName,
    size: fileStats.size,
    metadata,
    pdpResponse: response.data,
    submissionId
  };
}

async function getInvoiceById(id) {
  return await InvoicesModel.getInvoiceById(id);
}

const POLLING_INTERVAL = 2000; // 2 secondes
const POLLING_TIMEOUT = 60000; // 60 secondes max

async function pollInvoiceStatusPDP(invoiceId, submissionId) {
  const startTime = Date.now();
  let finalStatus = false;

  while (!finalStatus && Date.now() - startTime < POLLING_TIMEOUT) {
    try {
      // Requête au mock PDP
      const response = await axios.get(`${PDP_URL}/${submissionId}/status`);
      const { technicalStatus } = response.data;

      console.log(`📡 Polling invoice ${invoiceId}: status = ${technicalStatus}`);

      // Mettre à jour le statut technique
      await InvoicesModel.updateTechnicalStatus(invoiceId, { technicalStatus, submissionId });

      // Vérifier statut final
      if (technicalStatus === 'validated' || technicalStatus === 'rejected') {
        finalStatus = true;
        console.log(`✅ Invoice ${invoiceId} reached final status: ${technicalStatus}`);

        // 🔹 Déterminer le code spec et le label métier
        const businessData = technicalStatus === 'validated'
          ? { statusCode: 202, statusLabel: 'Facture conforme' }
          : { statusCode: 400, statusLabel: 'Rejetée par le PDP' };

        // Mettre à jour l'historique et le statut courant (via statusCode)
        await InvoicesModel.updateBusinessStatus(invoiceId, businessData);
        console.log(`📌 Statut métier mis à jour pour invoice ${invoiceId}`);
      } else {
        await new Promise(res => setTimeout(res, POLLING_INTERVAL));
      }
    } catch (err) {
      console.error(`❌ Polling failed for invoice ${invoiceId}:`, err.message);
      await new Promise(res => setTimeout(res, POLLING_INTERVAL));
    }
  }

  if (!finalStatus) {
    console.warn(`⚠️ Invoice ${invoiceId} polling timeout`);
  }

  return finalStatus;
}

// Récupérer le cycle de vie métier d'une facture auprès du PDP
async function requestInvoiceLifecycle(invoiceId) {
  const response = await axios.post(`${PDP_URL}/${invoiceId}/request-lifecycle`);
  const { submissionId, status: initialStatus, comment } = response.data;

  // On ne prend le commentaire que s'il existe
  const clientComment = comment || null;

  // Mise à jour en DB
  await InvoicesModel.updateBusinessStatus(invoiceId, { 
    businessStatus: initialStatus,
    submissionId,
    clientComment
  });

  console.log(`📤 Lifecycle requested for invoice ${invoiceId}: submissionId = ${submissionId}, status = ${initialStatus}, comment = ${clientComment || 'aucun'}`);

  return { invoiceId, submissionId, initialStatus, clientComment };
}

// Rafraîchir le cycle de vie métier depuis le PDP
async function refreshInvoiceLifecycle(invoiceId, submissionId) {
  try {
    const response = await axios.get(`${PDP_URL}/${submissionId}/lifecycle`);
    const { businessStatus, comment } = response.data;

    const clientComment = comment || null;

    console.log(`📡 Lifecycle refresh for invoice ${invoiceId}: status = ${businessStatus}, comment = ${clientComment || 'aucun'}`);

    // Mise à jour en DB
    await InvoicesModel.updateBusinessStatus(invoiceId, { 
      businessStatus, 
      submissionId, 
      clientComment 
    });

    // Retourner directement le nouveau statut pour que le front l'applique immédiatement
    return { businessStatus, clientComment };
  } catch (err) {
    console.error(`❌ Erreur refreshInvoiceLifecycle invoice ${invoiceId}:`, err);
    throw new Error("Erreur serveur");
  }
}

async function updateInvoiceLifecycle(invoiceId, lifecycle) {
  const invoice = await InvoicesModel.getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Facture introuvable");

  const lastStatus = Array.isArray(lifecycle) && lifecycle.length > 0
    ? lifecycle[lifecycle.length - 1]
    : null;

  const clientComment = lastStatus?.comment || null;

  // Préparer les données à mettre à jour
  const updatedData = {
    lifecycle,
    status_code: lastStatus?.code || invoice.status_code,
    business_status_label: lastStatus?.label || invoice.business_status_label,
    clientComment
  };

  if (lastStatus) {
    await InvoicesModel.updateBusinessStatus(invoiceId, {
      businessStatus: lastStatus.code,
      statusCode: lastStatus.code,
      statusLabel: lastStatus.label,
      clientComment
    });
  } else {
    console.log(`⚠️ Invoice ${invoiceId} : pas de statut métier à appliquer`);
  }

  return { ...invoice, ...updatedData };
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  registerGeneratedPdf,
  getInvoicesBySeller,
  sendInvoice,
  getInvoiceById,
  pollInvoiceStatusPDP,
  requestInvoiceLifecycle,
  refreshInvoiceLifecycle,
  updateInvoiceLifecycle
};