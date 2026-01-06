const { S3Client } = require("@aws-sdk/client-s3");

export const s3Client = new S3Client({
  endpoint: process.env.B2_ENDPOINT,
  region: "us-east-005",
  credentials: {
    accessKeyId: process.env.B2_KEY_ID,
    secretAccessKey: process.env.B2_APPLICATION_KEY,
  },
});
