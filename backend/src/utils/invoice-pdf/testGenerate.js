const { generateInvoicePdf } = require("./generateInvoicePdf");

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
    console.log("PDF généré ici :", filePath);
  } catch (err) {
    console.error("Erreur génération PDF :", err);
  }
}

test();
