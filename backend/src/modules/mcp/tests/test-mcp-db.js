// src/modules/mcp/tests/test-mcp-db.js
const mcpDB = require('../mcp.db');

async function test() {
  try {
    const invoices = await mcpDB.getInvoicesContext();
    console.log('✅ Nombre de factures récupérées :', invoices.length);
    console.log('📄 Exemple de 5 premières factures :', invoices.slice(0, 5));
  } catch (err) {
    console.error('❌ Erreur lors du test MCP DB :', err);
  }
}

test();
