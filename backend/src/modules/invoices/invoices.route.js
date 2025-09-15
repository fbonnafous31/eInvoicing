const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');
const upload = require('../../middlewares/upload'); 
const attachSeller = require('../../middlewares/attachSeller'); 
const checkJwt = require('../../middlewares/auth'); 

// Routes publiques (si besoin)

// Routes protégées par Auth0 et middleware attachSeller
router.use(checkJwt);    
router.use(attachSeller);

// Route spécifique pour envoyer la facture
router.post('/:id/send', InvoicesController.sendInvoice);

// Routes factures
router.get('/', InvoicesController.getInvoices);
router.get('/:id/generate-pdf', InvoicesController.createInvoicePdf);
router.get('/:id', InvoicesController.getInvoice);

router.post(
  '/',
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  InvoicesController.createInvoice
);

// Récupération du statut technique d'une facture
router.get('/:id/status', InvoicesController.getInvoiceStatus);
router.post('/:id/generate-pdf', InvoicesController.createInvoicePdf);

// Rafraîchir le statut métier d'une facture
router.post('/:id/refresh-status', InvoicesController.refreshInvoiceStatus);

// Marquer la facture comme encaissée
router.post('/:id/paid', InvoicesController.markInvoicePaid);

// Récupérer le cycle métier complet d'une facture
router.get('/:id/lifecycle', InvoicesController.getInvoiceLifecycle);

router.post('/generate-pdf', InvoicesController.generateInvoicePdfBuffer);

router.put(
  '/:id',
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  InvoicesController.updateInvoice
);

router.delete('/:id', InvoicesController.deleteInvoice);

module.exports = router;
