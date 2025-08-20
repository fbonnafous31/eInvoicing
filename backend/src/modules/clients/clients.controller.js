const ClientsService = require('./clients.service');
const pool = require('../../config/db'); // nécessaire pour checkSiret

// ----------------- Liste de tous les clients -----------------
async function getClients(req, res) {
  try {
    const clients = await ClientsService.listClients();
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Création d'un client -----------------
async function createClient(req, res) {
  try {
    const clientData = req.body;
    const newClient = await ClientsService.createClient(clientData);
    res.status(201).json(newClient);
  } catch (err) {
    console.error(err);

    // Gestion du SIRET déjà existant
    if (err.message.includes('SIRET')) {
      return res.status(400).json({ error: err.message });
    }

    // Autres erreurs de validation
    if (err.message.includes('requis') || err.message.includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }

    // Autres erreurs serveur
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
}

// ----------------- Récupérer un client par ID -----------------
async function getClientById(req, res) {
  try {
    const { id } = req.params;
    const client = await ClientsService.getClientById(id);

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Suppression d'un client -----------------
async function deleteClient(req, res) {
  const { id } = req.params;
  try {
    const deleted = await ClientsService.deleteClient(id);
    res.json({ message: 'Client supprimé', client: deleted });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message });
  }
}

// ----------------- Mise à jour d'un client -----------------
async function updateClient(req, res) {
  const { id } = req.params;
  const clientData = req.body;

  try {
    const updatedClient = await ClientsService.updateClientData(id, clientData);
    res.json(updatedClient);
  } catch (err) {
    console.error(err);

    // Gestion du SIRET déjà existant
    if (err.message.includes('SIRET')) {
      return res.status(400).json({ error: err.message });
    }

    // Client non trouvé
    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }

    // Autres erreurs de validation
    if (err.message.includes('requis') || err.message.includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }

    // Autres erreurs serveur
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Vérification SIRET côté front -----------------
async function checkSiret(req, res) {
  try {
    const siret = req.params.siret.replace(/\D/g, ''); // ne garder que les chiffres
    const result = await pool.query(
      'SELECT id FROM invoicing.clients WHERE siret = $1',
      [siret]
    );

    res.json({ exists: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = {
  getClients,
  createClient,
  getClientById,
  deleteClient,
  updateClient,
  checkSiret
};
