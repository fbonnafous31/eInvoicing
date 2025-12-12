const express = require('express');
const router = express.Router();
const SellersController = require('./sellers.controller');
const withLogging = require('../../middlewares/auth');
const attachSeller = require('../../middlewares/attachSeller');

// Helper pour logger sans planter
function safeLog(req, ...args) {
  if (req.log?.info) {
    req.log.info(...args);
  } else {
    console.log(...args);
  }
}

// ----------------------------
// Route publique (optionnelle)
// ----------------------------
router.get('/check-identifier', (req, res, next) => {
  safeLog(req, 'Vérification de l’identifiant vendeur');
  SellersController.checkIdentifier(req, res, next);
});

// ----------------------------
// Routes protégées par Auth0
// ----------------------------
router.use(withLogging);
router.use(attachSeller);

// Récupérer son vendeur
router.get('/me', (req, res, next) => {
  safeLog(req, 'Récupération du vendeur connecté');
  SellersController.getMySeller(req, res, next);
});

// Créer son vendeur (si pas encore créé)
router.post('/', (req, res, next) => {
  safeLog(req, 'Création d’un vendeur', { body: req.body });
  SellersController.createSeller(req, res, next);
});

// Mettre à jour son vendeur
router.put('/:id', (req, res, next) => {
  safeLog(req, `Mise à jour du vendeur ${req.params.id}`, { body: req.body });
  SellersController.updateSeller(req, res, next);
});

// Tester l’envoi via Resend
router.post('/smtp/test-resend', (req, res, next) => {
  safeLog(req, 'Test d’envoi SMTP via Resend');
  SellersController.testSmtpResend(req, res, next);
});

module.exports = router;
