const db = require('../../config/db');  

const SellersModel = require('./sellers.model');
console.log(SellersModel);

async function listSellers() {
  return await SellersModel.getAllSellers();
}

async function createSeller(sellerData) {
  return await SellersModel.insertSeller(sellerData);
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

async function getSellerByAuth0Id (auth0_id) {
  const result = await db.query(
    'SELECT * FROM invoicing.sellers WHERE auth0_id = $1',
    [auth0_id]
  );
  return result.rows[0] || null;
};

module.exports = {
  listSellers,
  createSeller,
  getSellerById,
  deleteSeller,
  updateSellerData, 
  getSellerByAuth0Id
};