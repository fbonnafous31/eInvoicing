// backend/src/middlewares/errorHandler.js

function errorHandler(err, res) {
  console.error(err); // log complet pour debug

  // Cas PostgreSQL - violation contrainte d'unicité
  if (err.code === '23505') {
    if (err.constraint === 'invoice_taxes_invoice_id_vat_rate_key') {
      return res.status(400).json({
        error: 'Vous ne pouvez pas saisir deux assiettes de TVA avec le même taux',
      });
    }

    // fallback générique pour d'autres contraintes uniques
    return res.status(400).json({
      error: 'Violation de contrainte d’unicité',
    });
  }

  // Autres erreurs => erreur serveur
  res.status(500).json({
    error: 'Erreur serveur',
  });
}

module.exports = errorHandler;
