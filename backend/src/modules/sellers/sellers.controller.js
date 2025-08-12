const SellersService = require('./sellers.service');

async function getSellers(req, res) {
  try {
    const sellers = await SellersService.listSellers();
    res.json(sellers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createSeller(req, res) {
  try {
    const sellerData = req.body;
    const newSeller = await SellersService.createSeller(sellerData);
    res.status(201).json(newSeller);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
}

module.exports = {
  getSellers,
  createSeller
};



