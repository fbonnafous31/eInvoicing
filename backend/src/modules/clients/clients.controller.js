const ClientsService = require('./clients.service');

async function getClients(req, res) {
  try {
    const clients = await ClientsService.listClients();
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createClient(req, res) {
  try {
    const clientData = req.body;
    const newClient = await ClientsService.createClient(clientData);
    res.status(201).json(newClient);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
}

async function getClientById(req, res) {
  try {
    const { id } = req.params;
    const client = await ClientsService.getClientById(id);

    if (!client) {
      return res.status(404).json({ message: 'Client non trouvé' });
    }

    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function deleteClient(req, res) {
  const { id } = req.params;
  try {
    const deleted = await ClientsService.deleteClient(id);
    res.json({ message: 'Client deleted', client: deleted });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message });
  }
}

async function updateClient(req, res) {
  const { id } = req.params;
  const clientData = req.body;

  try {
    const updatedClient = await ClientsService.updateClientData(id, clientData);
    res.json(updatedClient);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message });
  }
}

module.exports = {
  getClients,
  createClient,
  getClientById,
  deleteClient,
  updateClient
};
