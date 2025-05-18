require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
const session  = require('express-session');
const { Issuer, generators } = require('openid-client');  // works with 4.9.1
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const app     = express();

// Session Middleware
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }       //  
}));


// Enable CORS & JSON parsing
app.use(cors());
app.use(express.json());

let oidc;   // holds the configured client

(async () => {
  const issuer = await Issuer.discover(process.env.COGNITO_ISSUER);
  oidc = new issuer.Client({
    client_id:     process.env.COGNITO_CLIENT_ID,
    client_secret: process.env.COGNITO_CLIENT_SECRET,
    redirect_uris: [process.env.REDIRECT_URI],
    response_types:['code']
  });
  console.log('OpenID client initialised');
})().catch(err => {
  console.error('OpenID init error:', err);
  process.exit(1);
});

function ensureAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Auth required' });
  next();
}

app.get('/login', (req, res) => {
  const state = generators.state();
  const nonce = generators.nonce();
  req.session.state = state;
  req.session.nonce = nonce;

  const url = oidc.authorizationUrl({
    scope: 'openid email',
    state,
    nonce
  });
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  try {
    const params   = oidc.callbackParams(req);
    const tokens   = await oidc.callback(process.env.REDIRECT_URI, params, {
      state: req.session.state,
      nonce: req.session.nonce
    });

    const userInfo = await oidc.userinfo(tokens.access_token);
    req.session.user      = userInfo;          // store whatever you need
    req.session.tokens    = tokens;
    res.redirect('/');                         // or to your SPA entry
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).send('Auth error');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid', { path: '/' });      // remove persistent cookie
    const logoutUrl =
      `${process.env.COGNITO_DOMAIN}/logout` +
      `?client_id=${process.env.COGNITO_CLIENT_ID}` +
      `&logout_uri=${encodeURIComponent(process.env.LOGOUT_URI)}`;
    res.redirect(logoutUrl);
  });
});


// Multer → store uploads in memory
const upload = multer({ storage: multer.memoryStorage() });

// S3 client setup (only if S3_BUCKET is defined)
const S3_BUCKET = process.env.S3_BUCKET;
const s3 = S3_BUCKET
  ? new S3Client({ region: process.env.AWS_REGION })
  : null;

// Helper to upload a buffer to S3 and return its URL (or null if bucket unset)
async function uploadToS3(file) {
  if (!s3) {
    console.warn('⚠️  No S3_BUCKET defined—skipping upload for', file.originalname);
    return null;
  }
  const key = `tasks/${Date.now()}_${file.originalname}`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key:    key,
    Body:   file.buffer,
    ContentType: file.mimetype
  }));
  return `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

// RDS Pool (PostgreSQL)
const { pool } = require('./db/rds-config');

// ——— Tasks CRUD endpoints ———
app.use('/tasks', ensureAuth);


// Lambda‐style handlers
const createTask  = require('./lambda/tasks/createTask');
const getAllTasks = require('./lambda/tasks/getAllTasks');
const getTask     = require('./lambda/tasks/getTask');
const updateTask  = require('./lambda/tasks/updateTask');
const deleteTask  = require('./lambda/tasks/deleteTask');

// ——— test DB connection at startup ———
pool.connect()
  .then(client => {
    client.release();
    console.log('✅ Connected to PostgreSQL via pool');
  })
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// ——— simple sanity route ———
app.get('/', async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT NOW()');
    res.json({ serverTime: rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ——— health check ———
app.get('/health', async (_, res) => {
  try {
    const { rows } = await pool.query('SELECT 1 AS ok');
    res.json({ success: true, ok: rows[0].ok });
  } catch (err) {
    console.error('Health check error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ——— Tasks CRUD endpoints ———

// Create a task (handle file uploads)
app.post(
  '/tasks',
  upload.array('attachments'),
  async (req, res) => {
    try {
      // upload each file to S3 (or skip if no bucket)
      const urls = (await Promise.all(
        (req.files || []).map(f => uploadToS3(f))
      )).filter(Boolean);

      // merge files into the JSON body
      const event = {
        body: JSON.stringify({
          ...req.body,
          attachments: urls
        })
      };

      const { statusCode, body } = await createTask.handler(event);
      return res.status(statusCode).json(JSON.parse(body));
    } catch (err) {
      console.error('CreateTask error:', err);
      return res.status(500).json({ error: 'Server error creating task' });
    }
  }
);

// Read all tasks
app.get('/tasks', async (_, res) => {
  const { statusCode, body } = await getAllTasks.handler({});
  return res.status(statusCode).json(JSON.parse(body));
});

// Read a single task
app.get('/tasks/:taskId', async (req, res) => {
  const event = { pathParameters: { taskId: req.params.taskId } };
  const { statusCode, body } = await getTask.handler(event);
  return res.status(statusCode).json(JSON.parse(body));
});

// Update a task (handle file uploads)
app.put(
  '/tasks/:taskId',
  upload.array('attachments'),
  async (req, res) => {
    try {
      // upload new files to S3 (or skip)
      const newUrls = (await Promise.all(
        (req.files || []).map(f => uploadToS3(f))
      )).filter(Boolean);

      // parse incoming JSON fields
      const incoming = JSON.parse(req.body.data || '{}');
      const allAttachments = [
        ...(incoming.attachments || []),
        ...newUrls
      ];

      const event = {
        pathParameters: { taskId: req.params.taskId },
        body: JSON.stringify({
          ...incoming,
          attachments: allAttachments
        })
      };

      const { statusCode, body } = await updateTask.handler(event);
      return res.status(statusCode).json(JSON.parse(body));
    } catch (err) {
      console.error('UpdateTask error:', err);
      return res.status(500).json({ error: 'Server error updating task' });
    }
  }
);

// Delete a task
app.delete('/tasks/:taskId', async (req, res) => {
  const event = { pathParameters: { taskId: req.params.taskId } };
  const { statusCode, body } = await deleteTask.handler(event);
  if (statusCode === 204) return res.sendStatus(204);
  return res.status(statusCode).json(JSON.parse(body));
});

// ——— start listening ———
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Backend listening on http://localhost:${PORT}`);
});
