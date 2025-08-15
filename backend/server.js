const express = require('express');
const cors = require('cors');
const path = require('path');
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
<<<<<<< HEAD
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// Middleware global d'erreurs
app.use(errorHandler);
=======
>>>>>>> 5f08e77 (Jour 13 : liste des factures frontend, helpers et tooltips, stratégie de travail avec ChatGPT)

// Lancement serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
});
