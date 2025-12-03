const express = require("express");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { s3Client } = require("../../../config/s3Client"); 

const router = express.Router();

router.get("/:filename", async (req, res) => {
  const { filename } = req.params;
  req.log.info(`Récupération PDF proxy: ${filename}`);

  try {
    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: filename,
    });

    const response = await s3Client.send(command);
    res.setHeader("Content-Type", "application/pdf");
    response.Body.pipe(res);
  } catch (err) {
    req.log.error(`Erreur lors de la récupération du PDF ${filename}:`, err);
    res.status(500).send("Erreur lors de la récupération du PDF");
  }
});

module.exports = router;
