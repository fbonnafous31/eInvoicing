const path = require("path");

function generateStoredName(invoiceId, attachmentType, fileName) {
  const typePrefix = attachmentType === "main" ? "main" : "add";
  const timestamp = Date.now();
  const sanitizedName = fileName.replace(/\s+/g, "_");
  return `${invoiceId}_${typePrefix}_${timestamp}_${sanitizedName}`;
}

function getFinalPath(storedName = "") {
  return path.join(__dirname, "../uploads/invoices", storedName);
}

module.exports = { generateStoredName, getFinalPath };
