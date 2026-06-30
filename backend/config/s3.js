const { S3Client } = require("@aws-sdk/client-s3");

function isS3Enabled() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET
  );
}

let client = null;

function getS3Client() {
  if (!isS3Enabled()) return null;
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION || "ap-south-1",
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }
  return client;
}

module.exports = { getS3Client, isS3Enabled };
