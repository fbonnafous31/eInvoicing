const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');
const upload = require('../../middlewares/upload'); 

router.get('/', InvoicesController.listInvoices);
router.get('/:id', InvoicesController.getInvoice);
router.get("/:id/generate-pdf", InvoicesController.createInvoicePdf);

router.post('/', upload.fields([{ name: 'attachments', maxCount: 10 }]), InvoicesController.createInvoice);
router.post('/:id/generate-pdf', InvoicesController.createInvoicePdf);
router.post('/generate-pdf', InvoicesController.generateInvoicePdfBuffer); 

router.put('/:id', upload.fields([{ name: 'attachments', maxCount: 10 }]), InvoicesController.updateInvoice);

router.delete('/:id', InvoicesController.deleteInvoice);

module.exports = router;
