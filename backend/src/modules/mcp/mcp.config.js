// backend/src/modules/mcp/mcp.config.js

module.exports = {
  // Endpoint LLM local via Ollama
  llmEndpoint: null, 

  // Scope / permissions pour la lecture seule
  scopes: {
    readOnly: ["llm_factures"]
  }
};
