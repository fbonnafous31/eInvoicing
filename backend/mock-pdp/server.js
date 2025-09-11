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

  // Stocker le statut initial
  submissions[submissionId] = {
    invoiceId,
    status: 'received'
  };

  console.log(`📥 Facture reçue : ${invoiceId}, submissionId: ${submissionId}`);

  // Simuler un traitement asynchrone pour passer à validated/rejected
  setTimeout(() => {
    const finalStatus = Math.random() < 0.8 ? 'validated' : 'rejected';
    submissions[submissionId].status = finalStatus;
    console.log(`✅ Facture ${invoiceId} traitement terminé : ${finalStatus}`);
  }, 5000 + Math.random() * 5000); // délai aléatoire 5-10s

  res.json({
    status: 'received',
    submissionId
  });
});

// Récupération du statut PDP
app.get('/invoices/:submissionId/status', (req, res) => {
  const { submissionId } = req.params;
  const sub = submissions[submissionId];

  if (!sub) {
    return res.status(404).json({ error: 'Submission non trouvée' });
  }

  res.json({
    invoiceId: sub.invoiceId,
    technicalStatus: sub.status
  });
});

app.listen(PORT, () => {
  console.log(`[MOCK-PDP] Mock PDP démarré sur http://localhost:${PORT}`);
});
