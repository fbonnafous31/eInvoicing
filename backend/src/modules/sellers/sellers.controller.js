const SellersService = require('./sellers.service');
const logger = require('../../utils/logger');

async function getSellers(req, res) {
  try {
    const sellers = await SellersService.listSellers();
    res.json(sellers);
  } catch (err) {
    logger.error({ err }, "Erreur dans getSellers");
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function createSeller(req, res) {
  try {
    // Vérifie si l'utilisateur a déjà un vendeur attaché
    if (req.seller) {
      return res.status(400).json({
        error: "Un vendeur existe déjà pour cet utilisateur"
      });
    }

    const sellerData = req.body;
    const auth0_id = req.user.sub;

    const newSeller = await SellersService.createSeller(sellerData, auth0_id);
    res.status(201).json(newSeller);
  } catch (err) {
    logger.error({ err }, "Erreur dans createSeller");
    res.status(500).json({ error: 'Erreur serveur lors de la création' });
  }
}

async function getSellerById(req, res) {
  try {
    const { id } = req.params;
    const seller = await SellersService.getSellerById(id);

    if (!seller) {
      return res.status(404).json({ message: 'Vendeur non trouvé' });
    }

    res.json(seller);
  } catch (err) {
    logger.error({ err }, "Erreur dans getSellerById");
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function deleteSeller(req, res) {
  try {
    const { id } = req.params;
    const deleted = await SellersService.deleteSeller(id);
    res.json({ message: 'Seller deleted', seller: deleted });
  } catch (err) {
    logger.error({ err }, "Erreur dans deleteSeller");
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
    logger.error({ err }, "Erreur dans updateSeller");
    res.status(404).json({ error: err.message });
  }
}

async function getMySeller(req, res, next) {
  try {
    const seller = await SellersService.getSellerByAuth0Id(req.user.sub);

    if (!seller) {
      logger.warn("Aucun vendeur trouvé pour cet utilisateur");
      return res.status(404).json({
        message: "Aucun vendeur trouvé pour cet utilisateur"
      });
    }

    res.json(seller);
  } catch (err) {
    logger.error({ err }, "Erreur dans getMySeller");
    next(err);
  }
}

async function checkIdentifier(req, res) {
  try {
    const { identifier, id } = req.query;
    const exists = await SellersService.checkIdentifierExists(identifier, id);
    res.json({ exists });
  } catch (err) {
    logger.error({ err }, "Erreur dans checkIdentifier");
    res.status(500).json({ error: 'Erreur serveur' });
  }
}

async function testSmtpResend(req, res) {
  try {
    const { smtp_from } = req.body;

    if (!smtp_from) {
      return res.status(400).json({
        success: false,
        error: "smtp_from manquant"
      });
    }

    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: 'no-reply@resend.dev',
      to: smtp_from,
      subject: 'Test Resend OK ✅',
      text: 'Votre configuration email fonctionne via Resend.'
    });

    return res.json({
      success: true,
      message: "Email envoyé via Resend ✅"
    });

  } catch (error) {
    logger.error({ error }, "Erreur dans testSmtpResend");
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
}

module.exports = {
  getSellers,
  createSeller,
  getSellerById,
  deleteSeller,
  updateSeller,
  getMySeller,
  checkIdentifier,
  testSmtpResend
};
