// backend/mock-pdp/server.js
const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();
const PORT = 4000;

app.use(fileUpload());

app.post('/invoices', (req, res) => {
  if (!req.files || !req.files.invoice) {
    return res.status(400).send('No file uploaded.');
  }

  console.log('Fichier reçu :', req.files.invoice.name);
  res.send({ status: 'ok', message: 'Facture reçue' });
});

app.listen(PORT, () => console.log(`Mock PDP running on http://localhost:${PORT}`));
