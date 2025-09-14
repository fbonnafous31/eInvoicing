const express = require('express');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./src/middlewares/errorHandler');

const sellersRoutes = require('./src/modules/sellers/sellers.route');
const clientsRoutes = require('./src/modules/clients/clients.route');
const invoicesRoutes = require('./src/modules/invoices/invoices.route');

const app = express(); 

app.use((req, res, next) => {
  console.log('⚡ Requête reçue :', req.method, req.originalUrl);
  next();
});

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/sellers', sellersRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/invoices', invoicesRoutes);

// 📂 Rendre accessible tout le répertoire uploads
app.use('/uploads', express.static(path.join(__dirname, 'src/uploads')));

// 📂 Rendre accessible directement le sous-dossier pdf-a3
app.use(
  '/pdf-a3',
  express.static(path.join(__dirname, 'src/uploads/pdf-a3'))
);

// Middleware global d'erreurs
app.use(errorHandler);

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend démarré sur http://localhost:${PORT}`);
});
