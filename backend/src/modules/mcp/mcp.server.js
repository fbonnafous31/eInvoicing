// backend/src/modules/mcp/mcp.server.js
const express = require("express");
const router = express.Router();
const mcpService = require("./mcp.service");

// Endpoint principal pour les queries vers LLM via MCP
router.post("/query", async (req, res) => {
  try {
    const { query } = req.body;
    console.log("📡 /query reçu avec :", query);

    if (!query) {
      return res.status(400).json({ error: "query missing" });
    }

    // Appel direct au LLaMA local via MCP service
    const result = await mcpService.queryLLM(query);
    console.log("✅ Réponse MCP :", result);
    res.json(result);
  } catch (err) {
    console.error("❌ MCP /query error :", err.message || err);
    res.status(500).json({ error: "Internal MCP error" });
  }
});

// Endpoint health check
router.get("/health", (req, res) => {
  res.json({ status: "ok", module: "MCP" });
});

module.exports = router;
