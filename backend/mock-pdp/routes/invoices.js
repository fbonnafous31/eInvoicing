// routes/invoices.js
const express = require('express');
const multer = require('multer');
const { createSubmission, getSubmission, updateSubmission } = require('../services/submissions');

const router = express.Router();

// Multer : stockage avec nom original
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// POST /invoices/:id/send
router.post('/:id/send', (req, res) => {
  const invoiceId = req.params.id;
  const submissionId = `mock-sub-${invoiceId}-${Date.now()}`;

  // Crée un mock de submission pour suivi
  createSubmission(submissionId, {
    invoiceId,
    technicalStatus: 'received',
    lifecycle: [{ code: 202, label: 'Créée', createdAt: new Date().toISOString() }],
  });

  console.log(`[MOCK-PDP] Facture ${invoiceId} envoyée, submissionId: ${submissionId}`);
  res.json({ message: 'Facture envoyée', invoiceId, submissionId });
});

// POST /invoices : envoi facture
router.post('/', upload.single('invoice'), (req, res) => {
  // 🔥 Simule une erreur critique serveur
  // return res.status(500).json({ error: 'Erreur critique PDP simulée' });
  
  if (!req.file) return res.status(400).json({ error: 'Fichier manquant' });

  let metadata = null;
  if (req.body.metadata) {
    try { metadata = JSON.parse(req.body.metadata); } 
    catch { console.warn("⚠️ Metadata non parsable :", req.body.metadata); }
  }

  const invoiceId = req.file.originalname.split('-')[0];
  const submissionId = `sub_${invoiceId}_${Date.now()}`;

  createSubmission(submissionId, {
    invoiceId,
    technicalStatus: 'received',
    lifecycle: [{ code: 202, label: 'Créée', createdAt: new Date().toISOString() }],
    metadata
  });

  console.log(`📥 Facture reçue : ${req.file.originalname}, submissionId: ${submissionId}`);
  if (metadata) console.log("📌 Metadata reçue :", metadata);

  setTimeout(() => {
    const finalStatus = Math.random() < 0.8 ? 'validated' : 'rejected';
    updateSubmission(submissionId, { technicalStatus: finalStatus });
    console.log(`✅ Facture ${invoiceId} traitement terminé : ${finalStatus}`);
  }, 5000 + Math.random() * 5000);

  res.json({ status: 'received', submissionId });
});

// GET /invoices/:submissionId/status
router.get('/:submissionId/status', (req, res) => {
  const sub = getSubmission(req.params.submissionId);
  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });
  res.json({ invoiceId: sub.invoiceId, technicalStatus: sub.technicalStatus });
});

// POST /invoices/:submissionId/lifecycle/request
router.post('/:submissionId/lifecycle/request', (req, res) => {
  // 🔥 Simule une erreur critique serveur
  // return res.status(500).json({ error: 'Erreur critique PDP simulée' });

  const sub = getSubmission(req.params.submissionId);
  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });

  if (sub.technicalStatus === 'rejected') {
    return res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
  }

  const lastStatus = sub.lifecycle[sub.lifecycle.length - 1];
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

  const statusesWithComment = [206, 207, 208, 210];
  const commentsByStatus = {
    206: ["Approbation partielle : montant inférieur à la facture", "Facture validée partiellement suite contrôle manuel"],
    207: ["Litige : incohérence détectée sur le montant", "Litige client, vérification nécessaire"],
    208: ["Facture suspendue pour vérification interne", "Suspension temporaire : documents manquants"],
    210: ["Refusée : facture non conforme", "Refus PDP : erreur sur la référence client"]
  };

  for (const candidate of possibleStatuses) {
    if (candidate.code <= lastCode) continue;
    if (Math.random() <= candidate.probability) {
      if (candidate.code === 211 && [208, 210].includes(lastStatus?.code)) continue;
      const comment = statusesWithComment.includes(candidate.code)
        ? commentsByStatus[candidate.code][Math.floor(Math.random() * commentsByStatus[candidate.code].length)]
        : null;
      sub.lifecycle.push({ ...candidate, createdAt: new Date().toISOString(), comment });
      console.log(`📊 Cycle métier avancé pour ${req.params.submissionId} : ${candidate.label} (${comment || 'aucun commentaire'})`);
      break;
    }
  }

  const last = sub.lifecycle[sub.lifecycle.length - 1] || { code: lastCode, comment: null };
  res.json({ invoiceId: sub.invoiceId, businessStatus: last.code, comment: last.comment, lifecycle: sub.lifecycle });
});

// GET /invoices/:submissionId/lifecycle
router.get('/:submissionId/lifecycle', (req, res) => {
  // 🔥 Simule une erreur critique serveur
  // return res.status(500).json({ error: 'Erreur critique PDP simulée' });

  const sub = getSubmission(req.params.submissionId);
  if (!sub) return res.status(404).json({ error: 'Submission non trouvée' });
  res.json({ invoiceId: sub.invoiceId, lifecycle: sub.lifecycle });
});

module.exports = router;
