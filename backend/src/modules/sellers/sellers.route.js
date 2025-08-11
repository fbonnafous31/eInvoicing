const express = require('express');
const router = express.Router();
const SellersController = require('./sellers.controller');

router.get('/', SellersController.getSellers);

module.exports = router;
