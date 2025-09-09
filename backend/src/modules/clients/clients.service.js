const ClientsModel = require('./clients.model');

async function getClientsBySeller(sellerId) {
  return await ClientsModel.getClientsBySeller(sellerId);
}

async function createClient(clientData, sellerId) {
  return await ClientsModel.insertClient(clientData, sellerId);
}

async function getClientById(id, sellerId) {
  return await ClientsModel.getClientById(id, sellerId);
}

async function deleteClient(id, sellerId) {
  return await ClientsModel.removeClient(id, sellerId);
}

async function updateClientData(id, clientData, sellerId) {
  return await ClientsModel.updateClient(id, clientData, sellerId);
}

module.exports = {
  getClientsBySeller,
  createClient,
  getClientById,
  deleteClient,
  updateClientData
};
