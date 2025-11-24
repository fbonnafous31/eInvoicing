const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');
const attachSeller = require('../../middlewares/attachSeller'); 
const InvoiceMailController = require('./invoiceMail.controller');
const checkJwt = require('../../middlewares/auth'); 
const pdfProxy = require('./pdfProxy.route');
const { upload } = require('../../middlewares/upload');

// Routes publiques (si besoin)

// Routes protégées par Auth0 et middleware attachSeller
router.use(checkJwt);    
router.use(attachSeller);

// Route spécifique pour récupérer l'URL du PDF A3 d'une facture
router.get('/:id/pdf-a3-url', InvoicesController.getInvoicePdfA3Url);

// Route spécifique pour récupérer le PDF A3 d'une facture via un proxy
router.get('/:id/pdf-a3-proxy', InvoicesController.getInvoicePdfA3Proxy);

// Route spécifique pour envoyer la facture (nouvelle)
router.post('/:id/send-mail', InvoiceMailController.sendInvoiceMail);

// Route spécifique pour envoyer la facture
router.post('/:id/send', InvoicesController.sendInvoice);

// Routes factures
router.get('/', InvoicesController.getInvoices);
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

// Nouvelle route pour récupérer le commentaire d’un statut précis
router.get('/:id/status/:statusCode/comment', InvoicesController.getInvoiceStatusComment);

router.post('/generate-pdf', InvoicesController.generateInvoicePdfBuffer);

router.use("/pdf", pdfProxy);

router.put(
  '/:id',
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  InvoicesController.updateInvoice
);

router.delete('/:id', InvoicesController.deleteInvoice);

module.exports = router;
