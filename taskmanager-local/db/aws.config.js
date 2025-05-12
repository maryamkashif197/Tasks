require('dotenv').config();
const { v4: uuidv4 }                  = require('uuid');
const { S3Client, PutObjectCommand }  = require('@aws-sdk/client-s3');
const { SQSClient }                   = require('@aws-sdk/client-sqs');
const { SNSClient }                   = require('@aws-sdk/client-sns');
const { DynamoDBClient }              = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient }      = require('@aws-sdk/lib-dynamodb');

const region = process.env.AWS_REGION;

// DynamoDB (v3)
const ddbClient  = new DynamoDBClient({ region });
const dynamoDB   = DynamoDBDocumentClient.from(ddbClient);

// S3, SQS, SNS
const s3Client   = new S3Client({ region });
const sqsClient  = new SQSClient({ region });
const snsClient  = new SNSClient({ region });

module.exports = {
  dynamoDB,
  s3Client,
  PutObjectCommand,
  sqsClient,
  snsClient,
  uuidv4
};
