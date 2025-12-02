const ClientsService = require('./clients.service');
const pool = require('../../config/db');
const SCHEMA = process.env.DB_SCHEMA || 'public';

// ----------------- Liste des clients du seller connecté -----------------
async function getClients(req, res) {
  try {
    if (!req.seller) {
      req.log.warn("Accès refusé : seller non identifié");
      return res.status(403).json({ error: 'Seller non identifié' });
    }

    req.log.info({ sellerId: req.seller.id }, "Récupération des clients du seller");

    const clients = await ClientsService.getClientsBySeller(req.seller.id);
    res.json(clients);
  } catch (err) {
    req.log.error({ err }, "Erreur lors de getClients");
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Création d'un client pour le seller connecté -----------------
async function createClient(req, res) {
  try {
    if (!req.seller) {
      req.log.warn("Création client refusée : seller non identifié");
      return res.status(403).json({ error: 'Seller non identifié' });
    }

    const clientData = req.body;
    req.log.info({ sellerId: req.seller.id, clientData }, "Création d'un nouveau client");

    const newClient = await ClientsService.createClient(clientData, req.seller.id);
    res.status(201).json(newClient);

  } catch (err) {
    req.log.error({ err }, "Erreur lors de createClient");

    if (err.message.includes('SIRET')) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message.includes('requis') || err.message.includes('invalide')) {
      return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
}

// ----------------- Récupérer un client par ID (seller owner only) -----------------
async function getClientById(req, res) {
  try {
    if (!req.seller) {
      req.log.warn("Lecture client refusée : seller non identifié");
      return res.status(403).json({ error: 'Seller non identifié' });
    }

    const { id } = req.params;
    req.log.info({ sellerId: req.seller.id, clientId: id }, "Récupération d'un client");

    const client = await ClientsService.getClientById(id, req.seller.id);

    if (!client) {
      req.log.warn({ clientId: id }, "Client non trouvé");
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    res.json(client);

  } catch (err) {
    req.log.error({ err }, "Erreur lors de getClientById");
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

// ----------------- Suppression d'un client -----------------
async function deleteClient(req, res) {
  try {
    if (!req.seller) {
      req.log.warn("Suppression client refusée : seller non identifié");
      return res.status(403).json({ error: 'Seller non identifié' });
    }

    const { id } = req.params;
    req.log.info({ sellerId: req.seller.id, clientId: id }, "Suppression d'un client");

    const deleted = await ClientsService.deleteClient(id, req.seller.id);
    res.json({ message: 'Client supprimé', client: deleted });

  } catch (err) {
    req.log.error({ err }, "Erreur lors de deleteClient");
    res.status(404).json({ error: err.message });
  }
}

// ----------------- Mise à jour d'un client -----------------
async function updateClient(req, res) {
  try {
    if (!req.seller) {
      req.log.warn("Mise à jour client refusée : seller non identifié");
      return res.status(403).json({ error: 'Seller non identifié' });
    }

    const { id } = req.params;
    const clientData = req.body;

    req.log.info({ sellerId: req.seller.id, clientId: id, clientData }, "Mise à jour d'un client");

    const updatedClient = await ClientsService.updateClientData(id, clientData, req.seller.id);
    res.json(updatedClient);

  } catch (err) {
    req.log.error({ err }, "Erreur lors de updateClient");

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
    const rawSiret = req.params.siret;
    const siret = rawSiret.replace(/\D/g, '');
    const clientId = req.query.id ? parseInt(req.query.id, 10) : null;

    req.log.info({ siret, clientId }, "Vérification SIRET");

    let query = `SELECT id FROM ${SCHEMA}.clients WHERE siret = $1`;
    const params = [siret];

    if (clientId) {
      query += ' AND id != $2';
      params.push(clientId);
    }

    const result = await pool.query(query, params);
    res.json({ exists: result.rowCount > 0 });

  } catch (err) {
    req.log.error({ err }, "Erreur lors de checkSiret");
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
