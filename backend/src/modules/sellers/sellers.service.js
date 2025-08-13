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

module.exports = { listSellers, createSeller, getSellerById };
