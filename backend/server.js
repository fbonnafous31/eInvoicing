const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middlewares/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
const sellersRoutes = require('./src/modules/sellers/sellers.route');
const clientsRoutes = require('./src/modules/clients/clients.route');
const invoicesRoutes = require('./src/modules/invoices/invoices.route');

app.use('/api/sellers', sellersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);

// Middleware global d'erreurs
app.use(errorHandler);

// Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
});
