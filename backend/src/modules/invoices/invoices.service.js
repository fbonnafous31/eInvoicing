const InvoicesModel = require('./invoices.model');
const { generateFacturXXML } = require('../../utils/facturx-generator');
const fs = require('fs');
const path = require('path');

async function listInvoices() {
  return await InvoicesModel.getAllInvoices();
}

async function getInvoice(id) {
  const invoice = await InvoicesModel.getInvoiceById(id);
  return invoice || null;
}

/**
 * Crée une facture avec ses lignes, taxes et justificatifs
 */
async function createInvoice(data) {
  const { invoice, client, lines, taxes, attachments } = data;

  console.log("=== createInvoice called ===");

  // 1️⃣ Création en base
  const createdInvoice = await InvoicesModel.createInvoice({
    invoice,
    client,
    lines,
    taxes,
    attachments,
  });
  console.log("✅ Invoice created, id:", createdInvoice.id);

  // 2️⃣ Préparer le client pour le XML
  const clientForXML = createdInvoice.client ? {
    legal_name: createdInvoice.client.legal_name || 
                `${createdInvoice.client.client_legal_name || ''}`.trim(),
    address: createdInvoice.client.address || createdInvoice.client.client_address,
    city: createdInvoice.client.city || createdInvoice.client.client_city,
    postal_code: createdInvoice.client.postal_code || createdInvoice.client.client_postal_code,
    country_code: createdInvoice.client.country_code || createdInvoice.client.client_country_code,
    email: createdInvoice.client.email || createdInvoice.client.client_email,
    phone: createdInvoice.client.phone || createdInvoice.client.client_phone
  } : {};  

  // 3️⃣ Génération du Factur-X à partir des données créées
  const xml = generateFacturXXML({
    header: invoice,
    seller: createdInvoice.seller,
    client: clientForXML,
    lines,
    taxes,
    attachments
  });

  // 4️⃣ Sauvegarde du fichier XML sur disque
  const facturXPath = path.resolve('src/uploads/factur-x');
  if (!fs.existsSync(facturXPath)) {
    fs.mkdirSync(facturXPath, { recursive: true });
  }

  const xmlPath = path.join(facturXPath, `${createdInvoice.id}-factur-x.xml`);
  fs.writeFileSync(xmlPath, xml, 'utf-8');
  console.log("📄 Factur-X saved at:", xmlPath);

  // 5️⃣ Retourner l’objet enrichi
  return {
    ...createdInvoice,
    facturxPath: xmlPath
  };
}


/**
 * Met à jour une facture complète
 */
async function updateInvoice(id, data) {
  const { invoice, client, lines, taxes, attachments } = data;

  console.log("=== updateInvoice called for id:", id, "===");

  // 1. Mise à jour en base
  const updatedInvoice = await InvoicesModel.updateInvoice(id, {
    invoice,
    client,
    lines,
    taxes,
    newAttachments: attachments,
    existingAttachments: [] 
  });

  console.log("✅ Invoice updated, updatedInvoice:", updatedInvoice);

  // 2. Préparer le client pour le XML
  const clientForXML = updatedInvoice.client ? {
    legal_name: updatedInvoice.client.legal_name || 
                `${updatedInvoice.client.client_legal_name || ''}`.trim(),
    address: updatedInvoice.client.address || updatedInvoice.client.client_address,
    city: updatedInvoice.client.city || updatedInvoice.client.client_city,
    postal_code: updatedInvoice.client.postal_code || updatedInvoice.client.client_postal_code,
    country_code: updatedInvoice.client.country_code || updatedInvoice.client.client_country_code,
    email: updatedInvoice.client.email || updatedInvoice.client.client_email,
    phone: updatedInvoice.client.phone || updatedInvoice.client.client_phone
  } : {};  

  // 3. Génération du Factur-X à partir des données mises à jour
  const xml = generateFacturXXML({
    header: invoice,
    seller: updatedInvoice.seller,  
    client: clientForXML,
    lines,
    taxes,
    attachments
  });

  // 4. Sauvegarde du fichier XML sur disque
  const invoicesDir = path.resolve('src/uploads/factur-x');
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const xmlPath = path.join(invoicesDir, `${id}-factur-x.xml`);
  fs.writeFileSync(xmlPath, xml, 'utf-8');

  // 5. Retourne l’objet enrichi
  return {
    ...updatedInvoice,
    facturxPath: xmlPath
  };
}

async function deleteInvoice(id) {
  return await InvoicesModel.deleteInvoice(id);
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};
