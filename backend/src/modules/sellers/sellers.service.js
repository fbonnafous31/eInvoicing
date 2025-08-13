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

module.exports = {
  listSellers,
  createSeller,
  getSellerById,
  deleteSeller,
  updateSellerData
};