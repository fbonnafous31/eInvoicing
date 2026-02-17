// modules/mcp/mcp.db.js
const pool = require('../../config/db'); // réutilisation de ton pool existant

module.exports = {
  /**
   * Récupère toutes les factures depuis la vue sécurisée pour le LLM
   * @returns {Promise<Array>} - tableau d'objets factures
   */
  getInvoicesContext: async function () {
    try {
      const res = await pool.query('SELECT * FROM llm.llm_factures');
      return res.rows;
    } catch (err) {
      console.error('❌ Erreur lors de la récupération des factures pour le LLM :', err);
      throw err;
    }
  }
};
