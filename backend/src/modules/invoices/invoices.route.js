const express = require('express');
const router = express.Router();
const InvoicesController = require('./invoices.controller');
const InvoiceMailController = require('./invoiceMail.controller');
const attachSeller = require('../../middlewares/attachSeller'); 
const checkJwt = require('../../middlewares/auth'); 
const pdfProxy = require('./pdfProxy.route');
const { upload } = require('../../middlewares/upload');

// ----------------------------
// Middleware safe logger
// ----------------------------
router.use((req, res, next) => {
  if (!req.log) {
    const logger = require('../../utils/logger');
    req.log = {
      info: (...args) => logger.info(...args),
      error: (...args) => logger.error(...args),
    };
  }
  next();
});

// ----------------------------
// Routes protégées par Auth0 et attachSeller
// ----------------------------
router.use(checkJwt);
router.use(attachSeller);

// ----------------------------
// Factures spécifiques
// ----------------------------
router.get('/:id/pdf-a3-url', (req, res, next) => {
  req.log.info(`Récupération URL PDF A3 facture ${req.params.id}`);
  InvoicesController.getInvoicePdfA3Url(req, res, next);
});

router.get('/:id/pdf-a3-proxy', (req, res, next) => {
  req.log.info(`Récupération PDF A3 via proxy facture ${req.params.id}`);
  InvoicesController.getInvoicePdfA3Proxy(req, res, next);
});

router.post('/:id/send-mail', (req, res, next) => {
  req.log.info(`Envoi mail facture ${req.params.id}`);
  InvoiceMailController.sendInvoiceMail(req, res, next);
});

router.post('/:id/send', (req, res, next) => {
  req.log.info(`Envoi facture ${req.params.id}`);
  InvoicesController.sendInvoice(req, res, next);
});

// ----------------------------
// Routes CRUD factures
// ----------------------------
router.get('/', (req, res, next) => {
  req.log.info('Récupération de la liste des factures');
  InvoicesController.getInvoices(req, res, next);
});

router.get('/:id', (req, res, next) => {
  req.log.info(`Récupération facture ${req.params.id}`);
  InvoicesController.getInvoice(req, res, next);
});

router.post(
  '/',
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  (req, res, next) => {
    req.log.info('Création d’une facture', { body: req.body });
    InvoicesController.createInvoice(req, res, next);
  }
);

router.put(
  '/:id',
  upload.fields([{ name: 'attachments', maxCount: 10 }]),
  (req, res, next) => {
    req.log.info(`Mise à jour facture ${req.params.id}`, { body: req.body });
    InvoicesController.updateInvoice(req, res, next);
  }
);

router.delete('/:id', (req, res, next) => {
  req.log.info(`Suppression facture ${req.params.id}`);
  InvoicesController.deleteInvoice(req, res, next);
});

// ----------------------------
// Statut et cycle métier
// ----------------------------
router.get('/:id/status', (req, res, next) => {
  req.log.info(`Récupération statut technique facture ${req.params.id}`);
  InvoicesController.getInvoiceStatus(req, res, next);
});

router.post('/:id/generate-pdf', (req, res, next) => {
  req.log.info(`Génération PDF facture ${req.params.id}`);
  InvoicesController.createInvoicePdf(req, res, next);
});

router.post('/:id/refresh-status', (req, res, next) => {
  req.log.info(`Rafraîchissement statut métier facture ${req.params.id}`);
  InvoicesController.refreshInvoiceStatus(req, res, next);
});

router.post('/:id/paid', (req, res, next) => {
  req.log.info(`Marquage facture ${req.params.id} comme encaissée`);
  InvoicesController.markInvoicePaid(req, res, next);
});

router.get('/:id/lifecycle', (req, res, next) => {
  req.log.info(`Récupération cycle métier facture ${req.params.id}`);
  InvoicesController.getInvoiceLifecycle(req, res, next);
});

router.get('/:id/status/:statusCode/comment', (req, res, next) => {
  req.log.info(`Récupération commentaire statut ${req.params.statusCode} facture ${req.params.id}`);
  InvoicesController.getInvoiceStatusComment(req, res, next);
});

router.post('/generate-pdf', (req, res, next) => {
  req.log.info('Génération buffer PDF facture');
  InvoicesController.generateInvoicePdfBuffer(req, res, next);
});

// ----------------------------
// Proxy PDF
// ----------------------------
router.use("/pdf", pdfProxy);

module.exports = router;
