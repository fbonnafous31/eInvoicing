const express = require('express');
const router = express.Router();
const SellersController = require('./sellers.controller');
const checkJwt = require('../../middlewares/auth');
const attachSeller = require('../../middlewares/attachSeller');

router.get('/me', checkJwt, attachSeller, SellersController.getMySeller);

router.get('/', SellersController.getSellers);
router.post('/', SellersController.createSeller);
router.get('/:id', SellersController.getSellerById);
router.put('/:id', SellersController.updateSeller);
router.delete('/:id', SellersController.deleteSeller);

module.exports = router;
