const db = require('../../config/db');
const nodemailer = require('nodemailer');
const SellersModel = require('./sellers.model');

async function listSellers() {
  return await SellersModel.getAllSellers();
}

async function createSeller(sellerData, auth0_id) {
  return await SellersModel.insertSeller(sellerData, auth0_id);
}

async function getSellerById(id) {
  return await SellersModel.getSellerById(id);
}

async function deleteSeller(id) {
  return await SellersModel.removeSeller(id);
}

async function updateSellerData(id, sellerData) {
  return await SellersModel.updateSeller(id, sellerData);
}

async function getSellerByAuth0Id(auth0_id) {
  if (!auth0_id) return null;

  const sellerRes = await db.query(`SELECT * FROM invoicing.sellers WHERE auth0_id = $1`, [auth0_id]);
  const seller = sellerRes.rows[0];
  if (!seller) return null;

  const smtpRes = await db.query(`SELECT * FROM invoicing.seller_smtp_settings WHERE seller_id = $1`, [seller.id]);
  const smtp = smtpRes.rows[0] || {};

  return { ...seller, ...smtp };
}

async function checkIdentifierExists(identifier, sellerId) {
  const result = await db.query(
    'SELECT id FROM invoicing.sellers WHERE legal_identifier = $1 AND ($2::int IS NULL OR id != $2)',
    [identifier, sellerId || null]
  );
  return result.rowCount > 0;
}

async function getMySeller(auth0_id) {
  if (!auth0_id) return null;
  return await getSellerByAuth0Id(auth0_id);
}

async function testSmtp(config) {
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: config.smtp_secure,
    auth: {
      user: config.smtp_user,
      pass: config.smtp_pass,
    },
    connectionTimeout: 5000, 
    greetingTimeout: 5000,   
    socketTimeout: 5000,     
  });

  try {
    await transporter.verify();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = {
  listSellers,
  createSeller,
  getSellerById,
  deleteSeller,
  updateSellerData, 
  getSellerByAuth0Id,
  checkIdentifierExists,
  getMySeller,
  testSmtp
};