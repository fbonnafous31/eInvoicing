const db = require('../../config/db');  

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

  const result = await db.query(
    `SELECT *
     FROM invoicing.sellers
     WHERE auth0_id = $1`,
    [auth0_id]
  );
  return result.rows[0] || null;
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

module.exports = {
  listSellers,
  createSeller,
  getSellerById,
  deleteSeller,
  updateSellerData, 
  getSellerByAuth0Id,
  checkIdentifierExists,
  getMySeller
};