const express = require('express');
const router = express.Router();
const ClientsController = require('./clients.controller');
const attachSeller = require('../../middlewares/attachSeller'); 
const checkJwt = require('../../middlewares/auth'); 

// ----------------------------
// Middleware safe logger
// ----------------------------
router.use((req, res, next) => {
  if (!req.log) {
    const logger = require('../../utils/logger');
    req.log = {
      info: (...args) => logger.info(...args),
      error: (...args) => logger.error(...args),
    };
  }
  next();
});

// ----------------------------
// Vérification SIRET (public)
// ----------------------------
router.get('/check-siret/:siret', (req, res, next) => {
  req.log.info(`Vérification SIRET: ${req.params.siret}`);
  ClientsController.checkSiret(req, res, next);
});

// ----------------------------
// Routes protégées par Auth0
// ----------------------------
router.use(checkJwt);
router.use(attachSeller);

// Liste des clients
router.get('/', (req, res, next) => {
  req.log.info('Récupération de la liste des clients');
  ClientsController.getClients(req, res, next);
});

// Création d’un client
router.post('/', (req, res, next) => {
  req.log.info('Création d’un client', { body: req.body });
  ClientsController.createClient(req, res, next);
});

// Détail client
router.get('/:id', (req, res, next) => {
  req.log.info(`Récupération du client ${req.params.id}`);
  ClientsController.getClientById(req, res, next);
});

// Suppression client
router.delete('/:id', (req, res, next) => {
  req.log.info(`Suppression du client ${req.params.id}`);
  ClientsController.deleteClient(req, res, next);
});

// Mise à jour client
router.put('/:id', (req, res, next) => {
  req.log.info(`Mise à jour du client ${req.params.id}`, { body: req.body });
  ClientsController.updateClient(req, res, next);
});

module.exports = router;
