const ClientsModel = require('./clients.model');
console.log(ClientsModel);

async function listClients() {
  return await ClientsModel.getAllClients();
}

async function createClient(clientData) {
  return await ClientsModel.insertClient(clientData);
}

async function getClientById(id) {
  return await ClientsModel.getClientById(id);
}

async function deleteClient(id) {
  return await ClientsModel.removeClient(id);
}

async function updateClientData(id, clientData) {
  return await ClientsModel.updateClient(id, clientData);
}

module.exports = {
  listClients,
  createClient,
  getClientById,
  deleteClient,
  updateClientData
};