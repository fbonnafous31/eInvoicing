const express = require('express');
const router = express.Router();
const SellersController = require('./sellers.controller');

router.get('/', SellersController.getSellers);
router.post('/', SellersController.createSeller);

module.exports = router;
