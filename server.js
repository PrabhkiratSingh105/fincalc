const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

loadEnv();

const app = express();
app.use(cors());
const PORT = process.env.PORT || 3000;
const MAX_HISTORY_ITEMS = 50;
const PLACEHOLDER_VALUES = new Set([
  '',
  'your_supabase_service_role_secret_jwt_here',
  'your_supabase_url_here',
]);
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

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name, value) {
  if (!value || PLACEHOLDER_VALUES.has(String(value).trim())) {
    throw new Error(`${name} is required. Configure it with your Supabase project value before starting the backend.`);
  }
  return value;
}

const supabase = createClient(
  requireEnv('SUPABASE_URL or PUBLIC_SUPABASE_URL', SUPABASE_URL),
  requireEnv('SUPABASE_SERVICE_ROLE_KEY', SUPABASE_SERVICE_ROLE_KEY),
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

app.use(express.json({ limit: '20kb' }));

const BUILD_DIR = path.join(__dirname, 'build');
const BUILD_INDEX = path.join(BUILD_DIR, 'index.html');

function hasReactBuild() {
  return fs.existsSync(BUILD_INDEX);
}

function resolveIndexHtml() {
  if (hasReactBuild()) return BUILD_INDEX;
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
  if (!user?.salt || !user?.passwordHash) return false;
  const result = hashPassword(password, user.salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(result.hash, 'hex'), Buffer.from(user.passwordHash, 'hex'));
  } catch {
    return false;
  }
}

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

function throwSupabaseError(error) {
  if (error) throw error;
}

async function getUserByUsername(username) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  throwSupabaseError(error);
  return data;
}

async function updateUser(username, values) {
  const { data, error } = await supabase
    .from('users')
    .update(values)
    .eq('username', username)
    .select('*')
    .single();
  throwSupabaseError(error);
  return data;
}

async function getPublicConfigsForPage(page) {
  const { data, error } = await supabase
    .from('public_configs')
    .select('*')
    .eq('page', page)
    .order('createdAt', { ascending: false });
  throwSupabaseError(error);
  return data || [];
}

function normalizePublicConfig(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;

  return Object.fromEntries(
    Object.entries(input)
      .filter(([key, value]) => /^[a-zA-Z0-9_-]{1,48}$/.test(key) && ['string', 'number', 'boolean'].includes(typeof value))
  );
}

function slugify(value) {
  const slug = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || `portfolio-${Date.now()}`;
}

function resolvePortfolioSlug(configs, page, preferredSlug, username, portfolioId) {
  const existingForPortfolio = configs.find(
    (item) => item.page === page && item.username === username && item.portfolio?.id === portfolioId
  );
  if (existingForPortfolio) return existingForPortfolio.slug;

  const existingForSlug = configs.find((item) => item.page === page && item.slug === preferredSlug);
  if (!existingForSlug) return preferredSlug;
  if (existingForSlug.username === username && existingForSlug.portfolio?.id === portfolioId) return preferredSlug;

  const userSlug = slugify(`${preferredSlug}-${username}`);
  const existingForUserSlug = configs.find((item) => item.page === page && item.slug === userSlug);
  if (!existingForUserSlug) return userSlug;
  if (existingForUserSlug.username === username && existingForUserSlug.portfolio?.id === portfolioId) return userSlug;

  let index = 2;
  let candidate = `${userSlug}-${index}`;
  while (configs.some((item) => item.page === page && item.slug === candidate)) {
    index += 1;
    candidate = `${userSlug}-${index}`;
  }
  return candidate;
}

function normalizePublicPortfolio(input) {
  const portfolio = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const name = String(portfolio.name || '').trim();
  if (!name) return null;

  return {
    id: String(portfolio.id || crypto.randomUUID()),
    name,
    inflationAdjusted: Boolean(portfolio.inflationAdjusted),
    inflationRate: Number(portfolio.inflationRate ?? 6) || 6,
    timelineYear: Math.min(100, Math.max(1, Number(portfolio.timelineYear ?? 1) || 1)),
    updatedAt: portfolio.updatedAt || new Date().toISOString(),
    items: Array.isArray(portfolio.items)
      ? portfolio.items.map((item, index) => ({
          id: String(item?.id || `item_${index}`),
          type: String(item?.type || 'SIP'),
          configId: String(item?.configId || ''),
          configName: String(item?.configName || ''),
          resolvedConfig: item?.resolvedConfig && typeof item.resolvedConfig === 'object' ? item.resolvedConfig : null,
        }))
      : [],
  };
}

async function getAuthUser(req) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const tokenHash = hashToken(match[1]);
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('sessionHash', tokenHash)
    .maybeSingle();
  throwSupabaseError(error);
  if (!user) return null;
  return { user };
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

function defaultUserSettings() {
  return {
    defaultInflationRate: 6,
    customInflationRows: [
      { id: 'essentials', percentage: 50, rate: 6 },
      { id: 'lifestyle', percentage: 30, rate: 7 },
      { id: 'healthcare', percentage: 20, rate: 8 },
    ],
    portfolios: [],
  };
}

function normalizeSettings(input) {
  const base = defaultUserSettings();
  const safe = input && typeof input === 'object' ? input : {};
  const migratedPortfolios =
    Array.isArray(safe.portfolios) && safe.portfolios.length > 0
      ? safe.portfolios
      : safe.homePortfolio
        ? [{
            id: 'portfolio_legacy',
            name: String(safe.homePortfolio?.portfolioName || 'Portfolio 1'),
            inflationAdjusted: Boolean(safe.homePortfolio?.inflationAdjusted),
            timelineYear: Math.min(100, Math.max(1, Number(safe.homePortfolio?.timelineYear ?? 1) || 1)),
            updatedAt: new Date().toISOString(),
            items: Array.isArray(safe.homePortfolio?.items) ? safe.homePortfolio.items : [],
          }]
        : base.portfolios;

  return {
    defaultInflationRate: Number(safe.defaultInflationRate ?? base.defaultInflationRate) || base.defaultInflationRate,
    customInflationRows: Array.isArray(safe.customInflationRows) && safe.customInflationRows.length > 0
      ? safe.customInflationRows.map((row, index) => ({
          id: String(row?.id || `row_${index}`),
          percentage: Number(row?.percentage ?? 0),
          rate: Number(row?.rate ?? base.defaultInflationRate),
        }))
      : base.customInflationRows,
    portfolios: migratedPortfolios.map((portfolio, portfolioIndex) => ({
      id: String(portfolio?.id || `portfolio_${portfolioIndex}`),
      name: String(portfolio?.name || `Portfolio ${portfolioIndex + 1}`),
      inflationAdjusted: Boolean(portfolio?.inflationAdjusted),
      inflationRate: Number(portfolio?.inflationRate ?? base.defaultInflationRate) || base.defaultInflationRate,
      isPublic: Boolean(portfolio?.isPublic),
      publicSlug: String(portfolio?.publicSlug || ''),
      publicUrl: String(portfolio?.publicUrl || ''),
      timelineYear: Math.min(100, Math.max(1, Number(portfolio?.timelineYear ?? 1) || 1)),
      updatedAt: portfolio?.updatedAt || new Date().toISOString(),
      items: Array.isArray(portfolio?.items)
        ? portfolio.items.map((item, index) => ({
            id: String(item?.id || `item_${index}`),
            type: String(item?.type || 'SIP'),
            configId: String(item?.configId || ''),
            configName: String(item?.configName || ''),
            config: undefined,
            resolvedConfig: item?.resolvedConfig && typeof item.resolvedConfig === 'object' ? item.resolvedConfig : null,
          }))
        : [],
    })),
  };
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

    const user = await getUserByUsername(username);

    if (user) return res.status(409).json({ message: 'Username already exists. Please login.' });
    const { salt, hash } = hashPassword(password);
    const newUser = {
      username,
      salt,
      passwordHash: hash,
      history: [],
      configs: {},
      settings: defaultUserSettings(),
      createdAt: new Date().toISOString()
    };
    const token = createSession(newUser);
    const { data: createdUser, error } = await supabase
      .from('users')
      .insert(newUser)
      .select('*')
      .single();
    throwSupabaseError(error);
    res.json({ user: publicUser(createdUser), token });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Could not create account.' });
  }
});

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const username = normalizeUsername(req.body.username);
  const password = String(req.body.password || '');

  if (!isValidUsername(username)) {
    return res.status(400).json({ message: 'Enter a valid username with no spaces.' });
  }

  const user = await getUserByUsername(username);
  if (!user || !verifyPassword(password, user)) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  const token = createSession(user);
  const updatedUser = await updateUser(username, {
    sessionHash: user.sessionHash,
    sessionCreatedAt: user.sessionCreatedAt,
  });
  res.json({ user: publicUser(updatedUser), token });
}));

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.auth.user) });
});

app.post('/api/auth/logout', requireAuth, asyncHandler(async (req, res) => {
  await updateUser(req.auth.user.username, {
    sessionHash: null,
    sessionCreatedAt: null,
  });
  res.json({ ok: true });
}));

app.get('/api/settings', requireAuth, asyncHandler(async (req, res) => {
  req.auth.user.settings = normalizeSettings(req.auth.user.settings);
  await updateUser(req.auth.user.username, { settings: req.auth.user.settings });
  res.json({ settings: req.auth.user.settings });
}));

app.put('/api/settings', requireAuth, asyncHandler(async (req, res) => {
  req.auth.user.settings = normalizeSettings(req.body.settings);
  await updateUser(req.auth.user.username, { settings: req.auth.user.settings });
  res.json({ settings: req.auth.user.settings });
}));

app.post('/api/public-portfolios', requireAuth, asyncHandler(async (req, res) => {
  const portfolio = normalizePublicPortfolio(req.body.portfolio);
  if (!portfolio) {
    return res.status(400).json({ message: 'Portfolio data is incomplete.' });
  }

  const username = req.auth.user.username;
  const page = 'portfolio';
  const configs = await getPublicConfigsForPage(page);
  const preferredSlug = slugify(req.body.portfolio?.publicSlug || portfolio.name);
  const slug = resolvePortfolioSlug(configs, page, preferredSlug, username, portfolio.id);
  const existingEntry = configs.find((item) => item.page === page && item.slug === slug && item.username === username);
  const entry = {
    page,
    slug,
    username,
    portfolio,
    updatedAt: new Date().toISOString(),
  };

  if (existingEntry) {
    const { error } = await supabase
      .from('public_configs')
      .update({
        username,
        portfolio,
        updatedAt: entry.updatedAt,
      })
      .eq('page', page)
      .eq('slug', slug)
      .eq('username', username);
    throwSupabaseError(error);
  } else {
    entry.createdAt = new Date().toISOString();
    const { error } = await supabase
      .from('public_configs')
      .insert(entry);
    throwSupabaseError(error);
  }

  res.status(201).json({
    slug,
    url: `${req.protocol}://${req.get('host')}/portfolio/${encodeURIComponent(slug)}`,
    portfolio,
  });
}));

app.get('/api/public-portfolios/:slug', asyncHandler(async (req, res) => {
  const slug = slugify(req.params.slug);
  const { data: entry, error } = await supabase
    .from('public_configs')
    .select('*')
    .eq('page', 'portfolio')
    .eq('slug', slug)
    .maybeSingle();
  throwSupabaseError(error);
  if (!entry?.portfolio) return res.status(404).json({ message: 'Public portfolio not found.' });

  res.json({
    slug: entry.slug,
    username: entry.username,
    portfolio: entry.portfolio,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
  });
}));

app.get('/api/history', requireAuth, (req, res) => {
  res.json({ history: req.auth.user.history || [] });
});

app.post('/api/history', requireAuth, asyncHandler(async (req, res) => {
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
  await updateUser(req.auth.user.username, { history: req.auth.user.history });
  res.status(201).json({ history: req.auth.user.history });
}));

app.delete('/api/history/:id', requireAuth, asyncHandler(async (req, res) => {
  req.auth.user.history = (req.auth.user.history || []).filter((item) => item.id !== req.params.id);
  await updateUser(req.auth.user.username, { history: req.auth.user.history });
  res.json({ history: req.auth.user.history });
}));

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
    await updateUser(req.auth.user.username, { configs: req.auth.user.configs });
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

    await updateUser(req.auth.user.username, { configs: req.auth.user.configs });
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
    await updateUser(req.auth.user.username, { configs: req.auth.user.configs });
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

    const username = req.auth.user.username;
    const { data: existingEntry, error: selectError } = await supabase
      .from('public_configs')
      .select('*')
      .eq('page', page)
      .eq('username', username)
      .eq('configName', configName)
      .maybeSingle();
    throwSupabaseError(selectError);
    
    if (existingEntry) {
      // Update existing entry
      const { error } = await supabase
        .from('public_configs')
        .update({
          config,
          updatedAt: new Date().toISOString(),
        })
        .eq('page', page)
        .eq('username', username)
        .eq('configName', configName);
      throwSupabaseError(error);
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
      const { error } = await supabase
        .from('public_configs')
        .insert(entry);
      throwSupabaseError(error);
    }

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

    const { data: entry, error } = await supabase
      .from('public_configs')
      .select('*')
      .eq('page', page)
      .eq('username', username)
      .eq('configName', configName)
      .maybeSingle();
    throwSupabaseError(error);
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

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);

  if (req.path.startsWith('/api')) {
    return res.status(500).json({ message: err.message || 'Internal server error.' });
  }

  return res.status(500).send('Internal server error.');
});

// SPA fallback: React build, or the React public shell when not built yet.
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(resolveIndexHtml(), (err) => {
    if (err) next(err);
  });
});

app.listen(PORT, () => {
  const mode = hasReactBuild() ? 'React build' : 'React public shell';
  console.log(`PlanMyCapital is running at http://localhost:${PORT} [${mode}]`);
  if (!hasReactBuild()) {
    console.log('Tip: run "npm run build" for production, or "npm run dev" during development.');
  }
});
