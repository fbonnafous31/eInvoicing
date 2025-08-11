const SellersModel = require('./sellers.model');

async function listSellers() {
  return await SellersModel.getAllSellers();
}

module.exports = { listSellers };
