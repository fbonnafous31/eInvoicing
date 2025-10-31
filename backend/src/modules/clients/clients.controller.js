const ClientsService = require('./clients.service');
const pool = require('../../config/db');
const SCHEMA = process.env.DB_SCHEMA || 'public';

// ----------------- Liste des clients du seller connecté -----------------
async function getClients(req, res) {
  try {
    if (!req.seller) return res.status(403).json({ error: 'Seller non identifié' });

    const clients = await ClientsService.getClientsBySeller(req.seller.id);
    res.json(clients);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Création d'un client pour le seller connecté -----------------
async function createClient(req, res) {
  try {
    if (!req.seller) return res.status(403).json({ error: 'Seller non identifié' });

    const clientData = req.body;
    const newClient = await ClientsService.createClient(clientData, req.seller.id);
    res.status(201).json(newClient);
  } catch (err) {
    console.error(err);

    if (err.message.includes('SIRET')) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message.includes('requis') || err.message.includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
}

// ----------------- Récupérer un client par ID, uniquement s'il appartient au seller -----------------
async function getClientById(req, res) {
  try {
    if (!req.seller) return res.status(403).json({ error: 'Seller non identifié' });

    const { id } = req.params;
    const client = await ClientsService.getClientById(id, req.seller.id);

    if (!client) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json(client);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Suppression d'un client, uniquement si il appartient au seller -----------------
async function deleteClient(req, res) {
  try {
    if (!req.seller) return res.status(403).json({ error: 'Seller non identifié' });

    const { id } = req.params;
    const deleted = await ClientsService.deleteClient(id, req.seller.id);
    res.json({ message: 'Client supprimé', client: deleted });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message });
  }
}

// ----------------- Mise à jour d'un client, uniquement si il appartient au seller -----------------
async function updateClient(req, res) {
  try {
    if (!req.seller) return res.status(403).json({ error: 'Seller non identifié' });

    const { id } = req.params;
    const clientData = req.body;

    const updatedClient = await ClientsService.updateClientData(id, clientData, req.seller.id);
    res.json(updatedClient);
  } catch (err) {
    console.error(err);

    if (err.message.includes('SIRET')) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message.includes('not found')) {
      return res.status(404).json({ error: err.message });
    }

    if (err.message.includes('requis') || err.message.includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Vérification SIRET côté front -----------------
async function checkSiret(req, res) {
  try {
    const siret = req.params.siret.replace(/\D/g, '');
    const clientId = req.query.id ? parseInt(req.query.id, 10) : null;

    let query = `SELECT id FROM ${SCHEMA}.clients WHERE siret = $1`;
    const params = [siret];

    if (clientId) {
      query += ' AND id != $2';
      params.push(clientId);
    }

    const result = await pool.query(query, params);
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
