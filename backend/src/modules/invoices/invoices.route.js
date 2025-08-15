const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');

router.get('/', InvoicesController.getInvoices);

module.exports = router;
