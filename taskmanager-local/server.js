require('dotenv').config();
const express = require('express');
const app     = express();

// import your RDS pool
const { pool } = require('./db/rds-config');

// import your AWS clients (if you need them in routes)
const {
  dynamoDB,
  s3Client,
  PutObjectCommand,
  sqsClient,
  snsClient,
  uuidv4
} = require('./db/aws.config');

// Test DB connection on startup
pool.connect()
  .then(client => {
    client.release();
    console.log('✅ Connected to PostgreSQL via pool');
  })
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// A sample route
app.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    res.json({ serverTime: rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Listening on http://localhost:${PORT}`));
