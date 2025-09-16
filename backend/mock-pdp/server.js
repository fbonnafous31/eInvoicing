const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 4000;

// -------------------------------
// Multer : stockage avec nom original
// -------------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  }
});
const upload = multer({ storage });

// Stockage en mémoire des submissions
const submissions = {};

// -------------------------------
// Envoi d’une facture
// -------------------------------
app.post('/invoices', upload.single('invoice'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

  // ✅ Récupération optionnelle des métadonnées envoyées
  let metadata = null;
  if (req.body.metadata) {
    try {
      metadata = JSON.parse(req.body.metadata);
    } catch (err) {
      console.warn("⚠️ Metadata non parsable :", req.body.metadata);
    }
  }

  const invoiceId = req.file.originalname.split('-')[0];
  const submissionId = `sub_${invoiceId}_${Date.now()}`;

  // ✅ Initialisation du cycle métier avec 202
  submissions[submissionId] = {
    invoiceId,
    technicalStatus: 'received',
    lifecycle: [
      { code: 202, label: 'Créée', createdAt: new Date().toISOString() }
    ],
    metadata // 🔹 stocker pour consultation éventuelle
  };

  console.log(`📥 Facture reçue : ${req.file.originalname}, submissionId: ${submissionId}`);
  if (metadata) console.log("📌 Metadata reçue :", metadata);

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

  if (sub.technicalStatus === 'rejected') {
    console.log(`⚠️ Facture ${submissionId} rejetée, pas de statut métier ajouté`);
    return res.json({ invoiceId: sub.invoiceId, lifecycle: [] });
  }

  const lastStatus = sub.lifecycle[sub.lifecycle.length - 1];
  if (lastStatus?.code === 208) {
    console.log(`⚠️ Facture ${submissionId} suspendue, progression bloquée`);
    return res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
  }

  const lastCode = lastStatus ? lastStatus.code : 202;

  const possibleStatuses = [
    { code: 203, label: 'Mise à disposition', probability: 1.0 },
    { code: 204, label: 'Prise en charge', probability: 0.6 },
    { code: 205, label: 'Approuvée', probability: 0.6 },
    { code: 206, label: 'Approuvée partiellement', probability: 0.2 },
    { code: 207, label: 'En litige', probability: 0.2 },
    { code: 208, label: 'Suspendue', probability: 0.2 },
    { code: 210, label: 'Refusée', probability: 0.1 },
    { code: 211, label: 'Paiement transmis', probability: 1.0 },
  ];

  for (let i = 0; i < possibleStatuses.length; i++) {
    const candidate = possibleStatuses[i];
    if (candidate.code <= lastCode) continue;

    const rand = Math.random();
    if (rand <= candidate.probability) {
      if (candidate.code === 211 && [208, 210].includes(lastStatus?.code)) continue;

      sub.lifecycle.push({ ...candidate, createdAt: new Date().toISOString() });
      console.log(`📊 Cycle métier avancé pour ${submissionId} : ${candidate.label}`);
      break;
    } else {
      console.log(`📊 Facture ${submissionId} : statut ${candidate.label} non tiré (probabilité)`);
    }
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
// Historique complet
// -------------------------------
app.get('/invoices/:submissionId/lifecycle', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];
  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });

  res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
});

// -------------------------------
// Démarrage serveur
// -------------------------------
app.listen(PORT, () => {
  console.log(`[MOCK-PDP] Mock PDP démarré sur http://localhost:${PORT}`);
});
