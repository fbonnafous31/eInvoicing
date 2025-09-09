const express = require('express');
const router = express.Router();
const ClientsController = require('./clients.controller');
const attachSeller = require('../../middlewares/attachSeller'); 
const checkJwt = require('../../middlewares/auth'); 


// Vérification SIRET (pas besoin d'être authentifié)
router.get('/check-siret/:siret', ClientsController.checkSiret);

// Routes protégées par Auth0
router.use(checkJwt);
router.use(attachSeller);

router.get('/', ClientsController.getClients);
router.post('/', ClientsController.createClient);
router.get('/:id', ClientsController.getClientById);
router.delete('/:id', ClientsController.deleteClient);
router.put('/:id', ClientsController.updateClient);

module.exports = router;
