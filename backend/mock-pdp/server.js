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

// Envoi d’une facture
app.post('/invoices', upload.single('invoice'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Fichier manquant' });
  }

  const invoiceId = req.file.originalname.split('-')[0];
  const submissionId = `sub_${invoiceId}_${Date.now()}`;

  // Stocker le statut initial (technique + métier)
  submissions[submissionId] = {
    invoiceId,
    technicalStatus: 'received',
    lifecycle: [] // historique des statuts métiers
  };

  console.log(`📥 Facture reçue : ${invoiceId}, submissionId: ${submissionId}`);

  // Simuler un traitement asynchrone pour passer à validated/rejected
  setTimeout(() => {
    const finalStatus = Math.random() < 0.8 ? 'validated' : 'rejected';
    submissions[submissionId].technicalStatus = finalStatus;
    console.log(`✅ Facture ${invoiceId} traitement terminé : ${finalStatus}`);
  }, 5000 + Math.random() * 5000); // délai aléatoire 5-10s

  res.json({
    status: 'received',
    submissionId
  });
});

// Récupération du statut technique
app.get('/invoices/:submissionId/status', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];

  if (!sub) {
    return res.status(404).json({ error: 'Submission non trouvée' });
  }

  res.json({
    invoiceId: sub.invoiceId,
    technicalStatus: sub.technicalStatus
  });
});

// Demande d’un nouveau statut métier
app.post('/invoices/:submissionId/lifecycle/request', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];

  if (!sub) {
    return res.status(404).json({ error: 'Submission non trouvée' });
  }

  // Cycle simplifié de statuts métiers
  const possibleStatuses = [
    // Plateforme
    { code: 201, label: 'Émise par la plateforme' },
    { code: 202, label: 'Reçue par la plateforme' },
    { code: 203, label: 'Mise à disposition' },
    // Acheteur
    { code: 204, label: 'Prise en charge' },
    { code: 205, label: 'Approuvée' },
    { code: 206, label: 'Approuvée partiellement' },
    { code: 207, label: 'En litige' },
    { code: 208, label: 'Suspendue' },
    { code: 210, label: 'Refusée' },
    { code: 211, label: 'Paiement transmis' }
  ];

  // Ajouter le prochain statut de la séquence
  const nextStatus = possibleStatuses[sub.lifecycle.length];
  if (nextStatus) {
    sub.lifecycle.push({
      ...nextStatus,
      createdAt: new Date().toISOString()
    });
    console.log(`📊 Cycle métier avancé pour ${submissionId} : ${nextStatus.label}`);
  } else {
    console.log(`⚠️ Aucun nouveau statut disponible pour ${submissionId}`);
  }

  res.json({
    invoiceId: sub.invoiceId,
    lifecycle: sub.lifecycle
  });
});

// Récupération de l’historique complet des statuts métiers
app.get('/invoices/:submissionId/lifecycle', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];

  if (!sub) {
    return res.status(404).json({ error: 'Submission non trouvée' });
  }

  res.json({
    invoiceId: sub.invoiceId,
    lifecycle: sub.lifecycle
  });
});

app.listen(PORT, () => {
  console.log(`[MOCK-PDP] Mock PDP démarré sur http://localhost:${PORT}`);
});
