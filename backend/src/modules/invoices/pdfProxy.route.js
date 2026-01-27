const express = require("express");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../../../config/s3Client");

const router = express.Router();

router.get(/.*/, async (req, res) => {
  const key = req.path.replace(/^\/+/, "");

  req.log.info(`Récupération PDF proxy: ${key}`);

  if (!key || key.includes("..")) {
    return res.status(400).send("Clé invalide");
  }

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    res.setHeader(
      "Content-Type",
      response.ContentType || "application/pdf"
    );
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${key.split("/").pop()}"`
    );

    response.Body.pipe(res);
  } catch (err) {
    req.log.error({ err, key }, "Erreur récupération PDF B2");
    res.status(404).send("PDF introuvable");
  }
});

module.exports = router;
