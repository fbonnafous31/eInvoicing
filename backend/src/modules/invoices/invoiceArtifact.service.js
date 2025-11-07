const { generateFacturXXML } = require('../../utils/facturx/facturx-generator');
const { embedFacturXInPdf } = require('../../utils/invoice-pdf/pdf-generator');
const InvoicesAttachmentsModel = require('./invoiceAttachments.model');
const storageService = require('../../services');

/**
 * Prépare les données client pour la génération XML.
 * @private
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

async function _saveFacturXXML(id, invoiceData) {
  const xml = generateFacturXXML(invoiceData);
  const relativePath = `factur-x/${id}-factur-x.xml`;
  const savedPath = await storageService.save(xml, relativePath);
  console.log(`✅ Factur-X généré pour la facture ${id} à : ${savedPath}`);
  return savedPath; 
}

/**
 * Génère et sauvegarde les artefacts (XML et PDF/A-3) pour une facture.
 * @param {object} invoice - L'objet facture complet.
 * @returns {Promise<{xmlPath: string|null, pdfA3Path: string|null}>}
 */
async function generateInvoiceArtifacts(invoice) {
  let xmlPath = null;
  let pdfA3Path = null;

  try {
    const clientForXML = _prepareClientForXML(invoice.client);
    const invoiceDataForXML = {
      header: invoice,
      seller: invoice.seller,
      client: clientForXML,
      lines: invoice.lines,
      taxes: invoice.taxes,
      attachments: invoice.attachments,
    };

    xmlPath = await _saveFacturXXML(invoice.id, invoiceDataForXML);

    const mainPdfAttachment = await InvoicesAttachmentsModel.getAttachment(invoice.id, 'main');
    if (!mainPdfAttachment) throw new Error(`PDF principal introuvable pour la facture ${invoice.id}`);
    
    const additionalAttachments = await InvoicesAttachmentsModel.getAdditionalAttachments(invoice.id);
    pdfA3Path = await embedFacturXInPdf(mainPdfAttachment.file_path, xmlPath, additionalAttachments, invoice.id);
  } catch (err) {
    console.error(`❌ Erreur lors de la génération des artefacts pour la facture ${invoice.id}:`, err.message);
    // On ne lève pas d'erreur pour ne pas bloquer le flux principal.
    // La génération pourra être relancée.
  }

  return { xmlPath, pdfA3Path };
}

module.exports = {
  generateInvoiceArtifacts,
};
