// backend/mock-pdp/server.js
const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();
const PORT = 4000;

app.use(fileUpload());

app.post('/invoices', (req, res) => {
  try {
    // 🎲 Simulation aléatoire d'erreur technique (10% des cas)
    if (Math.random() < 0.1) {
      console.error('❌ Simulated random server error.');
      return res.status(500).json({
        status: 'ERROR',
        code: 'SERVER_ERROR',
        message: 'Random simulated server failure.'
      });
    }

    // Vérification de la présence du fichier
    if (!req.files || !req.files.invoice) {
      return res.status(400).json({
        status: 'ERROR',
        code: 'BAD_REQUEST',
        message: 'No invoice file uploaded.'
      });
    }

    const invoiceFile = req.files.invoice;
    console.log('📄 Fichier reçu :', invoiceFile.name, '-', invoiceFile.size, 'bytes');

    // Réponse technique OK
    return res.status(201).json({
      status: 'RECEIVED',
      submissionId: 'subm_' + Date.now(),
      filename: invoiceFile.name,
      size: invoiceFile.size,
      timestamp: new Date().toISOString(),
      details: 'Invoice successfully uploaded, pending validation.'
    });
  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({
      status: 'ERROR',
      code: 'SERVER_ERROR',
      message: 'Unexpected error while processing the request.'
    });
  }
});

app.listen(PORT, () =>
  console.log(`✅ Mock PDP running on http://localhost:${PORT}`)
);
