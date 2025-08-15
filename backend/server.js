const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const sellersRoutes = require('./src/modules/sellers/sellers.route');
const clientsRoutes = require('./src/modules/clients/clients.route');
const invoicesRoutes = require('./src/modules/invoices/invoices.route');

app.use('/api/sellers', sellersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);

// Lancement serveur
app.listen(3000, () => {
  console.log('Backend démarré sur http://localhost:3000');
});

