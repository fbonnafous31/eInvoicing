// backend/src/middlewares/attachSeller.js
const { getSellerByAuth0Id } = require('../modules/sellers/sellers.service');

async function attachSeller(req, res, next) {
  console.log("req.user:", req.user);
  try {
    if (req.user && req.user.sub) {
      const seller = await getSellerByAuth0Id(req.user.sub);
      req.seller = seller || null;
    }
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = attachSeller;
