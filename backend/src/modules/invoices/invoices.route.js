const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');

router.get('/', InvoicesController.listInvoices);
router.get('/:id', InvoicesController.getInvoice);
router.post('/', InvoicesController.createInvoice);
router.delete('/:id', InvoicesController.deleteInvoice);

module.exports = router;
