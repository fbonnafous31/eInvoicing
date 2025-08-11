const SellersService = require('./sellers.service');

async function getSellers(req, res) {
  try {
    console.log('getSellers appelé');
    const sellers = await SellersService.listSellers();
    console.log('Vendeurs récupérés :', sellers);
    res.json(sellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

module.exports = { getSellers };



