const express = require('express');
const cors = require('cors');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
const sellersRoutes = require('./src/modules/sellers/sellers.route');
app.use('/api/sellers', sellersRoutes);

// Lancement serveur
app.listen(3000, () => {
  console.log('Backend démarré sur http://localhost:3000');
});

