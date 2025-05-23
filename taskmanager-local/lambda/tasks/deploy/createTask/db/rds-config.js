// db/rds-config.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     Number(process.env.DB_PORT),
  user:     process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  // use DB_NAME if set, otherwise fall back to the real DB:
  database: process.env.DB_NAME || 'TaskManagerDB',
  ssl:      { rejectUnauthorized: false }
});

module.exports = { pool };
