const express = require('express');
const router = express.Router();
const ClientsController = require('./clients.controller');

router.get('/', ClientsController.getClients);
router.post('/', ClientsController.createClient);
router.get('/:id', ClientsController.getClientById);
router.delete('/:id', ClientsController.deleteClient);
router.put('/:id', ClientsController.updateClient);

module.exports = router;
