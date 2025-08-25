const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');
const upload = require('../../middlewares/upload'); // ton middleware multer

router.get('/', InvoicesController.listInvoices);
router.get('/:id', InvoicesController.getInvoice);
router.post(
  '/',
  upload.fields([
    { name: 'attachments', maxCount: 10 },
    { name: 'invoice', maxCount: 1 },
    { name: 'client', maxCount: 1 },
    { name: 'lines', maxCount: 1 },
    { name: 'taxes', maxCount: 1 },
    { name: 'attachments_meta', maxCount: 1 }
  ]),
  InvoicesController.createInvoice
);
router.delete('/:id', InvoicesController.deleteInvoice);

module.exports = router;
