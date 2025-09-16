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

  // Si la facture est rejetée, aucun statut métier
  if (sub.technicalStatus === 'rejected') {
    console.log(`⚠️ Facture ${submissionId} rejetée, pas de statut métier ajouté`);
    return res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
  }

  const lastStatus = sub.lifecycle[sub.lifecycle.length - 1];
  const lastCode = lastStatus ? lastStatus.code : 202;

  // Statuts possibles
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

  const statusesWithComment = [206, 207, 208, 210]; // codes nécessitant un commentaire

  const commentsByStatus = {
    206: [
      "Approbation partielle : montant inférieur à la facture",
      "Facture validée partiellement suite contrôle manuel"
    ],
    207: [
      "Litige : incohérence détectée sur le montant",
      "Litige client, vérification nécessaire"
    ],
    208: [
      "Facture suspendue pour vérification interne",
      "Suspension temporaire : documents manquants"
    ],
    210: [
      "Refusée : facture non conforme",
      "Refus PDP : erreur sur la référence client"
    ]
  };

  let newStatusAdded = false;

  for (let i = 0; i < possibleStatuses.length; i++) {
    const candidate = possibleStatuses[i];

    if (candidate.code <= lastCode) continue;

    if (Math.random() <= candidate.probability) {
      if (candidate.code === 211 && [208, 210].includes(lastStatus?.code)) continue;

      // Ajouter un commentaire réaliste uniquement si le code est dans la liste
      const comment = statusesWithComment.includes(candidate.code)
        ? commentsByStatus[candidate.code][Math.floor(Math.random() * commentsByStatus[candidate.code].length)]
        : null;

      sub.lifecycle.push({
        ...candidate,
        createdAt: new Date().toISOString(),
        comment
      });

      console.log(`📊 Cycle métier avancé pour ${submissionId} : ${candidate.label} (${comment || 'aucun commentaire'})`);
      newStatusAdded = true;
      break;
    } else {
      console.log(`📊 Facture ${submissionId} : statut ${candidate.label} non tiré (probabilité)`);
    }
  }

  // Si aucun statut nouveau n’a été tiré, renvoyer quand même le dernier existant
  const last = sub.lifecycle[sub.lifecycle.length - 1] || { code: lastCode, comment: null };

  res.json({
    invoiceId: sub.invoiceId,
    businessStatus: last.code,
    comment: last.comment,
    lifecycle: sub.lifecycle
  });
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