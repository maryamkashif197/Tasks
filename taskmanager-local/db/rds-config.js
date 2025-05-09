const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.RDS_ENDPOINT,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  port: 5432,
  ssl: { rejectUnauthorized: false } // Required for AWS RDS
});

module.exports = { pool };