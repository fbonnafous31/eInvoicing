const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');
const upload = require('../../middlewares/upload'); // ton middleware multer

router.get('/', InvoicesController.listInvoices);
router.get('/:id', InvoicesController.getInvoice);
router.post(
  '/',
  upload.array('attachments'), 
  InvoicesController.createInvoice
);
router.delete('/:id', InvoicesController.deleteInvoice);

module.exports = router;
