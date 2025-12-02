const { generateFacturXXML } = require('../../utils/facturx/facturx-generator');
const { embedFacturXInPdf } = require('../../utils/invoice-pdf/pdf-generator');
const InvoicesAttachmentsModel = require('./invoiceAttachments.model');
const storageService = require('../../services');
const logger = require('../../utils/logger');

/**
 * Normalisation côté XML
 */
function _prepareClientForXML(client) {
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

// _saveFacturXXML
async function _saveFacturXXML(id, invoiceData) {
  const xml = generateFacturXXML(invoiceData);
  const relativePath = `factur-x/${id}-factur-x.xml`;

  // storageService.save accepte un Buffer ou string
  await storageService.save(xml, relativePath);

  logger.info(`✅ Factur-X généré pour la facture ${id} à : ${relativePath}`);
  return relativePath; 
}


/**
 * Génère XML + PDF/A-3
 */
async function generateInvoiceArtifacts(invoice) {
  let xmlPath = null;
  let pdfA3Path = null;

  try {
    // 1) Génération des données XML
    const clientForXML = _prepareClientForXML(invoice.client);
    const invoiceDataForXML = {
      header: invoice,
      seller: invoice.seller,
      client: clientForXML,
      lines: invoice.lines,
      taxes: invoice.taxes,
      attachments: invoice.attachments,
    };

    // 2) Sauvegarde du XML
    xmlPath = await _saveFacturXXML(invoice.id, invoiceDataForXML);

    // 3) Récupération du PDF principal depuis la base
    const mainPdfAttachment = await InvoicesAttachmentsModel.getAttachment(invoice.id, 'main');
    if (!mainPdfAttachment) {
      throw new Error(`PDF principal introuvable pour la facture ${invoice.id}`);
    }

    // 4) Autres pièces jointes
    const additionalAttachments = (await InvoicesAttachmentsModel.getAdditionalAttachments(invoice.id))
    .map(att => ({
      ...att,
      file_path: att.file_path.replace(/^\/.*?\/backend\//, ''), // normaliser en relatif
    }));

    // 5) Génération du PDF/A-3 final
    pdfA3Path = await embedFacturXInPdf(
      mainPdfAttachment.file_path, 
      xmlPath,                     
      additionalAttachments,
      invoice.id
    );

  } catch (err) {
    logger.error(`❌ Erreur lors de la génération des artefacts pour la facture ${invoice.id} :`, err.message);
  }

  return { xmlPath, pdfA3Path };
}

module.exports = { generateInvoiceArtifacts };
