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

async function getSellerById(req, res) {
  try {
    const { id } = req.params;
    const seller = await SellersService.getSellerById(id);

    if (!seller) return res.status(404).json({ message: 'Vendeur non trouvé' });

    res.json(seller);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function deleteSeller(req, res) {
  try {
    const { id } = req.params;
    const deleted = await SellersService.deleteSeller(id);
    res.json({ message: 'Seller deleted', seller: deleted });
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message });
  }
}

async function updateSeller(req, res) {
  try {
    const { id } = req.params;
    const sellerData = req.body;
    const updatedSeller = await SellersService.updateSellerData(id, sellerData);
    res.json(updatedSeller);
  } catch (err) {
    console.error(err);
    res.status(404).json({ error: err.message });
  }
}

async function getMySeller(req, res, next) {
  try {
    console.log("[Backend] → getMySeller appelé");
    console.log("[Backend] req.user :", req.user);

    // 🔹 Utilise le service existant getSellerByAuth0Id
    const seller = await SellersService.getSellerByAuth0Id(req.user.sub);
    console.log("[Backend] ← seller trouvé :", seller);

    if (!seller) {
      console.warn("[Backend] Aucun vendeur trouvé pour cet utilisateur");
      return res.status(404).json({ message: "Aucun vendeur trouvé pour cet utilisateur" });
    }

    res.json(seller);
  } catch (err) {
    console.error("[Backend] Erreur getMySeller :", err);
    next(err);
  }
}

module.exports = {
  getSellers,
  createSeller,
  getSellerById,
  deleteSeller,
  updateSeller,
  getMySeller
};
