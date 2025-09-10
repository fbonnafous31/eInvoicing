const express = require('express');
const router = express.Router();
const SellersController = require('./sellers.controller');
const checkJwt = require('../../middlewares/auth');
const attachSeller = require('../../middlewares/attachSeller');

// Routes publiques (optionnel)
// Vérification de l'identifiant légal (SIRET) avant création
router.get('/check-identifier', SellersController.checkIdentifier);

// Routes protégées (JWT + seller attaché)
router.use(checkJwt);
router.use(attachSeller);

router.get('/me', SellersController.getMySeller);
router.get('/:id', SellersController.getSellerById);
router.get('/', SellersController.getSellers);
router.post('/', SellersController.createSeller);
router.put('/:id', SellersController.updateSeller);
router.delete('/:id', SellersController.deleteSeller);

module.exports = router;
