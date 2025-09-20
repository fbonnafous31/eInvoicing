const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const InvoicesModel = require('./invoices.model');
const InvoiceStatusModel = require('./invoiceStatus.model');
const SellersModel = require('../sellers/sellers.service');
const ClientsModel = require('../clients/clients.service');

const FACTURX_DIR = path.resolve('src/uploads/factur-x');
const PDP_URL = process.env.PDP_BASE_URL || 'http://localhost:4000/invoices';
const POLLING_INTERVAL = 2000; // 2 secondes
const POLLING_TIMEOUT = 60000; // 60 secondes max

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

async function sendInvoice(invoiceId, pdfPath) {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`Fichier PDF Factur-X non trouvé pour la facture ${invoiceId} à l'emplacement : ${pdfPath}`);
  }

  const fileStats = fs.statSync(pdfPath);
  const fileName = path.basename(pdfPath);

  const invoice = await InvoicesModel.getInvoiceById(invoiceId);
  if (!invoice) throw new Error(`Facture ${invoiceId} introuvable`);

  const seller = await SellersModel.getSellerById(invoice.seller_id);
  const client = await ClientsModel.getClientById(invoice.client_id);

  const metadata = {
    senderId: seller?.legal_identifier || seller?.id || 'unknown',
    receiverId: client?.legal_identifier || client?.siret || client?.id || 'unknown',
    invoiceId: invoice.invoice_number
  };

  const form = new FormData();
  form.append('invoice', fs.createReadStream(pdfPath));
  form.append('metadata', JSON.stringify(metadata));

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

  await InvoiceStatusModel.updateTechnicalStatus(invoiceId, { technicalStatus: initialStatus, submissionId });
  console.log(`✅ Facture ${invoiceId} envoyée :`, response.data);

  // Lancer le polling en arrière-plan
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

async function pollInvoiceStatusPDP(invoiceId, submissionId) {
  const startTime = Date.now();
  let finalStatus = false;

  const invoice = await InvoicesModel.getInvoiceById(invoiceId);
  const currentBusinessStatus = Number(invoice.business_status);

  while (!finalStatus && Date.now() - startTime < POLLING_TIMEOUT) {
    try {
      const response = await axios.get(`${PDP_URL}/${submissionId}/status`);
      const { technicalStatus } = response.data;

      console.log(`📡 Polling invoice ${invoiceId}: status = ${technicalStatus}`);

      await InvoiceStatusModel.updateTechnicalStatus(invoiceId, { technicalStatus, submissionId });

      if (technicalStatus === 'validated' || technicalStatus === 'rejected') {
        finalStatus = true;
        console.log(`✅ Invoice ${invoiceId} reached final status: ${technicalStatus}`);

        let businessData;
        if (technicalStatus === 'validated') {
          if (currentBusinessStatus === 208) {
            businessData = { statusCode: 209, statusLabel: 'Réémission après suspension' };
            console.log(`🔄 Statut métier de la facture ${invoiceId} mis à jour à 209 après réception PDP`);
          } else {
            businessData = { statusCode: 202, statusLabel: 'Facture conforme' };
          }
        } else {
          businessData = { statusCode: 400, statusLabel: 'Rejetée par le PDP' };
        }

        await InvoiceStatusModel.updateBusinessStatus(invoiceId, businessData);
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

async function requestInvoiceLifecycle(invoiceId) {
  const response = await axios.post(`${PDP_URL}/${invoiceId}/request-lifecycle`);
  const { submissionId, status: initialStatus, comment } = response.data;
  const clientComment = comment || null;

  await InvoiceStatusModel.updateBusinessStatus(invoiceId, { 
    businessStatus: initialStatus,
    submissionId,
    clientComment
  });

  console.log(`📤 Lifecycle requested for invoice ${invoiceId}: submissionId = ${submissionId}, status = ${initialStatus}, comment = ${clientComment || 'aucun'}`);
  return { invoiceId, submissionId, initialStatus, clientComment };
}

async function refreshInvoiceLifecycle(invoiceId, submissionId) {
  try {
    const response = await axios.get(`${PDP_URL}/${submissionId}/lifecycle`);
    const { businessStatus, comment } = response.data;
    const clientComment = comment || null;

    console.log(`📡 Lifecycle refresh for invoice ${invoiceId}: status = ${businessStatus}, comment = ${clientComment || 'aucun'}`);

    await InvoiceStatusModel.updateBusinessStatus(invoiceId, { 
      businessStatus, 
      submissionId, 
      clientComment 
    });

    return { businessStatus, clientComment };
  } catch (err) {
    console.error(`❌ Erreur refreshInvoiceLifecycle invoice ${invoiceId}:`, err);
    throw new Error("Erreur serveur");
  }
}

async function updateInvoiceLifecycle(invoiceId, lifecycle) {
  const invoice = await InvoicesModel.getInvoiceById(invoiceId);
  if (!invoice) throw new Error("Facture introuvable");

  const lastStatus = Array.isArray(lifecycle) && lifecycle.length > 0 ? lifecycle[lifecycle.length - 1] : null;
  const clientComment = lastStatus?.comment || null;

  if (lastStatus) {
    await InvoiceStatusModel.updateBusinessStatus(invoiceId, {
      businessStatus: lastStatus.code,
      statusCode: lastStatus.code,
      statusLabel: lastStatus.label,
      clientComment
    });
  } else {
    console.log(`⚠️ Invoice ${invoiceId} : pas de statut métier à appliquer`);
  }

  return await InvoicesModel.getInvoiceById(invoiceId);
}

/**
 * Récupère l'historique du cycle de vie depuis le PDP.
 * @param {string} submissionId - L'ID de soumission au PDP.
 * @returns {Promise<Array>} Le tableau du cycle de vie.
 */
async function getPdpLifecycle(submissionId) {
  const response = await axios.get(`${PDP_URL}/${submissionId}/lifecycle`);
  return response.data.lifecycle;
}

/**
 * Demande une mise à jour de statut au PDP.
 * @param {string} submissionId - L'ID de soumission au PDP.
 * @param {object} [statusUpdatePayload] - Le payload pour la mise à jour de statut.
 * @returns {Promise<object>} La réponse du PDP.
 */
async function requestPdpStatusUpdate(submissionId, statusUpdatePayload) {
  const response = await axios.post(
    `${PDP_URL}/${submissionId}/lifecycle/request`,
    statusUpdatePayload,
    { headers: { 'Content-Type': 'application/json' }, timeout: 5000 }
  );
  return response.data;
}

module.exports = {
  sendInvoice,
  pollInvoiceStatusPDP,
  requestInvoiceLifecycle,
  refreshInvoiceLifecycle,
  updateInvoiceLifecycle,
  getPdpLifecycle,
  requestPdpStatusUpdate,
};
