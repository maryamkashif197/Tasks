const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require('uuid');

AWS.config.update({ region: 'eu-north-1' });

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();
const sqs = new AWS.SQS();


dynamoDB.listTables({}, (err, data) => {
  if (err) {
    console.error("❌ Connection FAILED:", err.message);
    console.log("Possible causes: Invalid credentials, no internet, or wrong region");
  } else {
    console.log("✅ Connected to AWS DynamoDB. Tables:", data.TableNames);
  }
});

module.exports = { dynamoDB, sns, sqs, uuidv4 };