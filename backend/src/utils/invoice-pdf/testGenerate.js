const { generateInvoicePdf } = require("./generateInvoicePdf");
const logger = require("../logger");

async function test() {
  const dummyInvoice = {
    id: 999,
    invoice_number: "TEST-999",
    client: {
      legal_name: "Client Test SARL"
    }
  };

  try {
    const filePath = await generateInvoicePdf(dummyInvoice);
    logger.info("PDF généré ici :", filePath);
  } catch (err) {
    logger.error("Erreur génération PDF :", err);
  }
}

test();
