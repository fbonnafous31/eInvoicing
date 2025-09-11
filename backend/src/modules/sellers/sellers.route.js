const express = require('express');
const router = express.Router();
const SellersController = require('./sellers.controller');
const checkJwt = require('../../middlewares/auth');
const attachSeller = require('../../middlewares/attachSeller');

// Route publique (optionnelle)
router.get('/check-identifier', SellersController.checkIdentifier);

// Routes protégées
router.use(checkJwt);
router.use(attachSeller);

// Récupérer son vendeur
router.get('/me', SellersController.getMySeller);

// Créer son vendeur (si pas encore créé)
router.post('/', SellersController.createSeller);

// Mettre à jour son vendeur
router.put('/:id', SellersController.updateSeller);

module.exports = router;
