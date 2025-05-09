const express = require('express'); 
const app = express();
const { Client } = require('pg');
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { SQSClient } = require("@aws-sdk/client-sqs");

require('dotenv').config();

// Initialize AWS SQS Client (v3)
const sqsClient = new SQSClient({ region: 'eu-north-1' });

// Initialize PostgreSQL client
const dbClient = new Client({
  host: process.env.DB_HOST,         // Host of the database
  port: process.env.DB_PORT,         // Port (usually 5432)
  user: process.env.DB_USERNAME,     // Username
  password: process.env.DB_PASSWORD, // Password
  database: process.env.DB_NAME,     // Database name
  ssl: { rejectUnauthorized: true }  // SSL settings (for RDS)
});

// Connect to PostgreSQL on server startup
dbClient.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// Sample route
app.get('/', (req, res) => {
  res.send('🚀 Task Manager API is running!');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
