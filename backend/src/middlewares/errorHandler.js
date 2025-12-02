/* eslint-disable no-unused-vars */
const logger = require('../utils/logger');

function errorHandler(err, req, res, next) { 
  logger.error(err); 

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

  // Cas Error classique avec message (comme ton throw dans le modèle)
  if (err instanceof Error && err.message) {
    return res.status(400).json({
      error: err.message,
    });
  }

  // Autres erreurs => erreur serveur
  res.status(500).json({
    error: 'Erreur serveur',
  });
}

module.exports = errorHandler;
