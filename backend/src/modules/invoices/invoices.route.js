const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');
const upload = require('../../middlewares/upload'); 
const attachSeller = require('../../middlewares/attachSeller'); 
const checkJwt = require('../../middlewares/auth'); 

// Vérification si besoin (pas obligatoire ici, tu peux créer une route publique si tu veux)
  
// Routes protégées par Auth0 et middleware attachSeller
router.use(checkJwt);    
router.use(attachSeller);

// Routes factures
router.get('/', InvoicesController.getInvoices);
router.get('/:id', InvoicesController.getInvoice);
router.get('/:id/generate-pdf', InvoicesController.createInvoicePdf);

router.post(
  '/',
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  InvoicesController.createInvoice
);

router.post('/:id/generate-pdf', InvoicesController.createInvoicePdf);
router.post('/generate-pdf', InvoicesController.generateInvoicePdfBuffer);

router.put(
  '/:id',
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  InvoicesController.updateInvoice
);

router.delete('/:id', InvoicesController.deleteInvoice);

module.exports = router;
