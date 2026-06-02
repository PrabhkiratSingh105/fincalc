const crypto = require('crypto');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const express = require('express');

loadEnv();

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const PUBLIC_CONFIGS_FILE = path.join(__dirname, 'public-configs.json');
const MAX_HISTORY_ITEMS = 50;
const VALID_PUBLIC_PAGES = new Set([
  'sip',
  'lumpsum',
  'ppf',
  'swp',
  'loan',
  'retirement',
  'goal-sip',
  'inflation',
  'cagr',
  'loan-prepayment',
  'loan-eligibility',
  'income-tax',
  'fd',
  'rd',
]);

app.use(express.json({ limit: '20kb' }));

const BUILD_DIR = path.join(__dirname, 'build');
const BUILD_INDEX = path.join(BUILD_DIR, 'index.html');
const FALLBACK_INDEX = path.join(__dirname, 'main.html');

function hasReactBuild() {
  return fs.existsSync(BUILD_INDEX);
}

function resolveIndexHtml() {
  if (hasReactBuild()) return BUILD_INDEX;
  if (fs.existsSync(FALLBACK_INDEX)) return FALLBACK_INDEX;
  return path.join(__dirname, 'public', 'index.html');
}

// Serve production React build only when it exists (avoids empty shell page)
if (fs.existsSync(BUILD_DIR)) {
  app.use(express.static(BUILD_DIR));
}

function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  require('fs').existsSync(envPath) && require('fs').readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const index = trimmed.indexOf('=');
      if (index === -1) return;
      const key = trimmed.slice(0, index).trim();
      const value = trimmed.slice(index + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    });
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9_]{3,24}$/.test(username);
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
  return { salt, hash };
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createSession(user) {
  const token = crypto.randomBytes(32).toString('hex');
  user.sessionHash = hashToken(token);
  user.sessionCreatedAt = new Date().toISOString();
  return token;
}

function verifyPassword(password, user) {
  const result = hashPassword(password, user.salt);
  return crypto.timingSafeEqual(Buffer.from(result.hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
}

async function readUsers() {
  try {
    return JSON.parse(await fsp.readFile(USERS_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeUsers(users) {
  await fsp.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
}

async function readPublicConfigs() {
  try {
    return JSON.parse(await fsp.readFile(PUBLIC_CONFIGS_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writePublicConfigs(configs) {
  await fsp.writeFile(PUBLIC_CONFIGS_FILE, JSON.stringify(configs, null, 2));
}

function normalizePublicConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  return Object.fromEntries(
    Object.entries(input)
      .filter(([key, value]) => /^[a-zA-Z0-9_-]{1,48}$/.test(key) && ['string', 'number', 'boolean'].includes(typeof value))
  );
}

async function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const tokenHash = hashToken(match[1]);
  const users = await readUsers();
  const user = users.find((item) => item.sessionHash === tokenHash);
  if (!user) return null;
  return { user, users };
}

async function requireAuth(req, res, next) {
  try {
    const auth = await getAuthUser(req);
    if (!auth) return res.status(401).json({ message: 'Please login first.' });
    req.auth = auth;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Authentication failed.' });
  }
}

function publicUser(user) {
  return { username: user.username };
}

// API routes above, catch-all for React routing below

app.post('/api/auth/signup', async (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    const password = String(req.body.password || '');

    if (!isValidUsername(username)) {
      return res.status(400).json({ message: 'Username must be 3-24 characters with no spaces. Use letters, numbers, or underscore.' });
    }
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });

    const users = await readUsers();
    const user = users.find((item) => item.username === username);

    if (user) return res.status(409).json({ message: 'Username already exists. Please login.' });
    const { salt, hash } = hashPassword(password);
    const newUser = { username, salt, passwordHash: hash, history: [], configs: {}, createdAt: new Date().toISOString() };
    const token = createSession(newUser);
    users.push(newUser);
    await writeUsers(users);
    res.json({ user: publicUser(newUser), token });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not create account.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const password = String(req.body.password || '');

  if (!isValidUsername(username)) {
    return res.status(400).json({ message: 'Enter a valid username with no spaces.' });
  }

  const users = await readUsers();
  const user = users.find((item) => item.username === username);
  if (!user || !verifyPassword(password, user)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = createSession(user);
  await writeUsers(users);
  res.json({ user: publicUser(user), token });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.auth.user) });
});

app.post('/api/auth/logout', requireAuth, async (req, res) => {
  delete req.auth.user.sessionHash;
  delete req.auth.user.sessionCreatedAt;
  await writeUsers(req.auth.users);
  res.json({ ok: true });
});

app.get('/api/history', requireAuth, (req, res) => {
  res.json({ history: req.auth.user.history || [] });
});

app.post('/api/history', requireAuth, async (req, res) => {
  const item = req.body || {};
  const calcType = String(item.calcType || '').trim();
  const title = String(item.title || '').trim();
  const summary = item.summary && typeof item.summary === 'object' ? item.summary : null;
  const inputs = item.inputs && typeof item.inputs === 'object' ? item.inputs : null;

  if (!['sip', 'swp', 'lumpsum', 'emi', 'fd', 'rd'].includes(calcType)) {
    return res.status(400).json({ message: 'Invalid calculator type.' });
  }
  if (!title || !summary || !inputs) {
    return res.status(400).json({ message: 'Calculation history is incomplete.' });
  }

  const entry = {
    id: crypto.randomUUID(),
    calcType,
    title,
    summary,
    inputs,
    createdAt: new Date().toISOString()
  };

  req.auth.user.history = [entry, ...(req.auth.user.history || [])].slice(0, MAX_HISTORY_ITEMS);
  await writeUsers(req.auth.users);
  res.status(201).json({ history: req.auth.user.history });
});

app.delete('/api/history/:id', requireAuth, async (req, res) => {
  req.auth.user.history = (req.auth.user.history || []).filter((item) => item.id !== req.params.id);
  await writeUsers(req.auth.users);
  res.json({ history: req.auth.user.history });
});

app.get('/api/configs/:page', requireAuth, (req, res) => {
  const page = String(req.params.page || '').trim();
  const configs = (req.auth.user.configs && req.auth.user.configs[page]) || [];
  res.json({ configs });
});

app.post('/api/configs/:page', requireAuth, async (req, res) => {
  try {
    const page = String(req.params.page || '').trim();
    const name = String(req.body.name || '').trim();
    const config = req.body.config && typeof req.body.config === 'object' ? req.body.config : null;

    if (!page) {
      return res.status(400).json({ message: 'Invalid page.' });
    }
    if (!name) {
      return res.status(400).json({ message: 'Name is required.' });
    }
    if (!config) {
      return res.status(400).json({ message: 'Configuration data is incomplete.' });
    }
    if (Object.keys(config).length === 0) {
      return res.status(400).json({ message: 'Configuration data is incomplete.' });
    }

    if (!req.auth.user.configs) {
      req.auth.user.configs = {};
    }
    if (!req.auth.user.configs[page]) {
      req.auth.user.configs[page] = [];
    }

    const configEntry = {
      id: crypto.randomUUID(),
      name,
      config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    req.auth.user.configs[page].unshift(configEntry);
    await writeUsers(req.auth.users);
    res.status(201).json({ config: configEntry });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not save configuration.' });
  }
});

app.put('/api/configs/:page/:id', requireAuth, async (req, res) => {
  try {
    const page = String(req.params.page || '').trim();
    const id = String(req.params.id || '').trim();
    const name = req.body.name !== undefined ? String(req.body.name || '').trim() : null;
    const config = req.body.config && typeof req.body.config === 'object' ? req.body.config : null;

    if (!page || !id) {
      return res.status(400).json({ message: 'Invalid page or config id.' });
    }

    if (!req.auth.user.configs || !req.auth.user.configs[page]) {
      return res.status(404).json({ message: 'Configuration not found.' });
    }

    const configEntry = req.auth.user.configs[page].find((c) => c.id === id);
    if (!configEntry) {
      return res.status(404).json({ message: 'Configuration not found.' });
    }

    if (name !== null) {
      configEntry.name = name;
    }
    if (config) {
      configEntry.config = config;
    }
    configEntry.updatedAt = new Date().toISOString();

    await writeUsers(req.auth.users);
    res.json({ config: configEntry });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not update configuration.' });
  }
});

app.delete('/api/configs/:page/:id', requireAuth, async (req, res) => {
  try {
    const page = String(req.params.page || '').trim();
    const id = String(req.params.id || '').trim();

    if (!page || !id) {
      return res.status(400).json({ message: 'Invalid page or config id.' });
    }

    if (!req.auth.user.configs || !req.auth.user.configs[page]) {
      return res.status(404).json({ message: 'Configuration not found.' });
    }

    req.auth.user.configs[page] = req.auth.user.configs[page].filter((c) => c.id !== id);
    await writeUsers(req.auth.users);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not delete configuration.' });
  }
});

app.post('/api/public-configs', requireAuth, async (req, res) => {
  try {
    const page = String(req.body.page || '').trim();
    const configName = String(req.body.configName || '').trim();
    const config = normalizePublicConfig(req.body.config);

    if (!VALID_PUBLIC_PAGES.has(page)) {
      return res.status(400).json({ message: 'Invalid calculator page.' });
    }
    if (!configName) {
      return res.status(400).json({ message: 'Configuration name is required.' });
    }
    if (!config || Object.keys(config).length === 0) {
      return res.status(400).json({ message: 'Configuration data is incomplete.' });
    }

    const configs = await readPublicConfigs();
    const username = req.auth.user.username;
    
    // Check if a config with this name already exists for this user and page
    const existingEntry = configs.find(
      (item) => item.page === page && item.username === username && item.configName === configName
    );
    
    if (existingEntry) {
      // Update existing entry
      existingEntry.config = config;
      existingEntry.updatedAt = new Date().toISOString();
    } else {
      // Create new entry
      const entry = {
        page,
        username,
        configName,
        config,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      configs.unshift(entry);
    }
    
    await writePublicConfigs(configs.slice(0, 500));

    res.status(201).json({
      url: `${req.protocol}://${req.get('host')}/${page}/${username}/config/${encodeURIComponent(configName)}`,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not create public link.' });
  }
});

app.get('/api/public-configs/:page/:username/:configName', async (req, res) => {
  try {
    const page = String(req.params.page || '').trim();
    const username = String(req.params.username || '').trim();
    const configName = decodeURIComponent(String(req.params.configName || '').trim());

    if (!VALID_PUBLIC_PAGES.has(page)) {
      return res.status(404).json({ message: 'Shared configuration not found.' });
    }

    const configs = await readPublicConfigs();
    const entry = configs.find(
      (item) => item.page === page && item.username === username && item.configName === configName
    );
    if (!entry) return res.status(404).json({ message: 'Shared configuration not found.' });

    res.json({
      page: entry.page,
      username: entry.username,
      configName: entry.configName,
      config: entry.config,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not load public link.' });
  }
});

// SPA fallback: React build, or standalone main.html when not built yet
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(resolveIndexHtml(), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, () => {
  const mode = hasReactBuild() ? 'React build' : 'standalone (main.html)';
  console.log(`FinCalc is running at http://localhost:${PORT} [${mode}]`);
  if (!hasReactBuild()) {
    console.log('Tip: run "npm run build" for the React app, or "npm run dev" during development.');
  }
});
