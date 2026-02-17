const { exec } = require("child_process");
const config = require("./mcp.config");
const mcpDB = require("./mcp.db");

module.exports = {
  scopes: config.scopes,

  queryLLM: async function (query) {
    console.log("📥 Requête reçue dans MCP service :", query);

    try {
      // 1️⃣ Récupérer les factures
      const invoices = await mcpDB.getInvoicesContext();
      console.log(`📄 Contexte factures récupéré : ${invoices.length} factures`);

      // 2️⃣ Calcul des totaux par année
      const totalByYear = {};
      invoices.forEach(inv => {
        const year = inv.fiscal_year;
        if (!totalByYear[year]) totalByYear[year] = 0;
        totalByYear[year] += Number(inv.total);
      });

      const totalsSummary = Object.entries(totalByYear)
        .map(([year, total]) => `Chiffre d'affaires ${year} : ${total.toFixed(2)}€`)
        .join("\n");

      // 3️⃣ Calcul des totaux par client et par année
      const totalsByClientYear = {};
      invoices.forEach(inv => {
        const year = inv.fiscal_year;
        const client = inv.client_name;
        if (!totalsByClientYear[year]) totalsByClientYear[year] = {};
        if (!totalsByClientYear[year][client]) totalsByClientYear[year][client] = 0;
        totalsByClientYear[year][client] += Number(inv.total);
      });

      const clientSummary = Object.entries(totalsByClientYear)
        .map(([year, clients]) =>
          Object.entries(clients)
            .map(([client, total]) => `${year} - ${client} - ${total.toFixed(2)}€`)
            .join("\n")
        )
        .join("\n");

      // 4️⃣ Construire le prompt générique pour LLaMA
      const userPrompt = query.prompt || "";
      const fullPrompt = `
Tu es un assistant financier pour eInvoicing.
Voici les totaux par année :
${totalsSummary}

Voici les totaux par client et par année :
${clientSummary}

Question : ${userPrompt}

Réponds uniquement à la question, de manière claire et concise, sans inventer de calcul ni ajouter de commentaires inutiles.
`;

      console.log("🌐 Prompt envoyé à LLaMA :", fullPrompt);

      // 5️⃣ Appel Ollama via exec
      const cmd = `echo ${JSON.stringify(fullPrompt)} | ollama run llama3`;

      return new Promise((resolve, reject) => {
        exec(cmd, { maxBuffer: 1024 * 1024 }, (err, stdout, stderr) => {
          if (err) {
            console.error("❌ Erreur MCP :", stderr || err.message);
            return reject(new Error(`Erreur LLaMA local : ${stderr || err.message}`));
          }

          const answer = stdout.trim();
          console.log("✅ Réponse reçue du LLM :", answer);

          resolve({
            answer,
            timestamp: new Date().toISOString()
          });
        });
      });

    } catch (ex) {
      console.error("💥 Exception MCP service :", ex);
      throw ex;
    }
  }
};
