require('dotenv').config();
const axios = require('axios');

async function testMCP() {
  try {
    // Ici on envoie un vrai prompt métier au MCP
    const query = {
      // prompt: "Quel est le chiffre d'affaires total pour l'année 2025 ?"
      prompt: "Quels sont les 3 clients qui ont générés le plus de chiffre d'affaires en 2025 ?"
      // prompt: "Peux tu me lister les factures impayées en retard ?"
    };
    console.log("📡 Test MCP - envoi de la query :", query);

    const response = await axios.post(
      "http://localhost:3000/mcp/query",
      { query },
      {
        headers: {
          Authorization: `Bearer ${process.env.MCP_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("✅ Réponse MCP :", response.data);
  } catch (err) {
    console.error("❌ Erreur lors du test MCP :", err.response?.data || err.message);
  }
}

testMCP();
