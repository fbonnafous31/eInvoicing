// server.js
const express = require('express');
const cors = require('cors');
const invoicesRouter = require('./routes/invoices');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/invoices', invoicesRouter);

// Middleware global pour catcher les erreurs non attrapées
app.use((err, req, res, next) => {
  console.error('🔥 ERREUR SERVER:', err.message);
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Middleware 404 pour routes non définies
app.use((req, res) => {
  console.log(`⚠️ Route non trouvée: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route non trouvée' });
});

// Démarrage serveur
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`[MOCK-PDP] Mock PDP démarré sur http://localhost:${PORT}`);
});
