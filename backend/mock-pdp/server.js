const express = require('express');
const multer = require('multer');
const cors = require('cors');

const upload = multer({ dest: 'uploads/' });
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// Stockage en mémoire des submissions
const submissions = {};

// -------------------------------
// Envoi d’une facture
// -------------------------------
app.post('/invoices', upload.single('invoice'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

  const invoiceId = req.file.originalname.split('-')[0];
  const submissionId = `sub_${invoiceId}_${Date.now()}`;

  submissions[submissionId] = {
    invoiceId,
    technicalStatus: 'received',
    lifecycle: []
  };

  console.log(`📥 Facture reçue : ${invoiceId}, submissionId: ${submissionId}`);

  // Traitement technique simulé
  setTimeout(() => {
    const finalStatus = Math.random() < 0.8 ? 'validated' : 'rejected';
    submissions[submissionId].technicalStatus = finalStatus;
    console.log(`✅ Facture ${invoiceId} traitement terminé : ${finalStatus}`);
  }, 5000 + Math.random() * 5000);

  res.json({ status: 'received', submissionId });
});

// -------------------------------
// Récupération du statut technique
// -------------------------------
app.get('/invoices/:submissionId/status', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];

  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });

  res.json({ invoiceId: sub.invoiceId, technicalStatus: sub.technicalStatus });
});

// -------------------------------
// Rafraîchissement du cycle métier 
// -------------------------------
app.post('/invoices/:submissionId/lifecycle/request', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];
  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });

  // Si la facture est rejetée techniquement, ne pas avancer le cycle métier
  if (sub.technicalStatus === 'rejected') {
    console.log(`⚠️ Facture ${submissionId} rejetée, pas de statut métier ajouté`);
    return res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
  }

  const possibleStatuses = [
    { code: 202, label: 'Reçue par la plateforme' },
    { code: 203, label: 'Mise à disposition' },
    { code: 204, label: 'Prise en charge' },
    { code: 205, label: 'Approuvée' },
    { code: 206, label: 'Approuvée partiellement' },
    { code: 207, label: 'En litige' },
    { code: 208, label: 'Suspendue' },
    { code: 210, label: 'Refusée' },
    { code: 211, label: 'Paiement transmis' },
    { code: 212, label: 'Encaissement constaté' }
  ];

  const lastCode = sub.lifecycle.length ? sub.lifecycle[sub.lifecycle.length - 1].code : 201;

  const nextStatus = possibleStatuses.find(s => s.code > lastCode);
  if (nextStatus) {
    sub.lifecycle.push({ ...nextStatus, createdAt: new Date().toISOString() });
    console.log(`📊 Cycle métier avancé pour ${submissionId} : ${nextStatus.label}`);
  }

  res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
});

// -------------------------------
// Encaissement spécifique
// -------------------------------
app.post('/invoices/:submissionId/paid', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];
  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });

  const lastCode = sub.lifecycle.length ? sub.lifecycle[sub.lifecycle.length - 1].code : 0;
  if (lastCode < 212) {
    sub.lifecycle.push({ code: 212, label: 'Encaissement constaté', createdAt: new Date().toISOString() });
    console.log(`💰 Facture ${submissionId} : encaissement constaté`);
  }

  sub.technicalStatus = 'validated';

  res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
});

// -------------------------------
// Récupération de l’historique complet des statuts métiers
// -------------------------------
app.get('/invoices/:submissionId/lifecycle', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];

  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });

  res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
});

// -------------------------------
// Démarrage du serveur
// -------------------------------
app.listen(PORT, () => {
  console.log(`[MOCK-PDP] Mock PDP démarré sur http://localhost:${PORT}`);
});
