// db/aws.config.js
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');

const { 
  S3Client, 
  PutObjectCommand 
} = require('@aws-sdk/client-s3');

const { 
  SQSClient, 
  ReceiveMessageCommand, 
  DeleteMessageCommand 
} = require('@aws-sdk/client-sqs');

const { 
  SNSClient, 
  PublishCommand, 
  SubscribeCommand, 
  ListSubscriptionsByTopicCommand 
} = require('@aws-sdk/client-sns');

const { 
  DynamoDBClient 
} = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand 
} = require('@aws-sdk/lib-dynamodb');

const { 
  SESClient, 
  SendEmailCommand 
} = require('@aws-sdk/client-ses');

const region = process.env.AWS_REGION;

module.exports = {
  // UUID helper
  uuidv4,

  // S3
  s3Client:         new S3Client({ region }),
  PutObjectCommand,

  // SQS
  sqsClient:        new SQSClient({ region }),
  ReceiveMessageCommand,
  DeleteMessageCommand,

  // SNS
  snsClient:        new SNSClient({ region }),
  PublishCommand,
  SubscribeCommand,
  ListSubscriptionsByTopicCommand,

  // DynamoDB
  dynamoDB:         DynamoDBDocumentClient.from(new DynamoDBClient({ region })),
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,

  // SES
  sesClient:        new SESClient({ region }),
  SendEmailCommand,
};
