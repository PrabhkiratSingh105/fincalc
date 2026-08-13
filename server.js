const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');
const { GoogleGenAI } = require('@google/genai');

loadEnv();

const app = express();
app.set('trust proxy', true);
app.use(cors());
const PORT = process.env.PORT || 3000;
const MAX_HISTORY_ITEMS = 50;
const AI_MODEL = 'nvidia/nvidia-nemotron-nano-9b-v2';
const AI_MAX_TOOL_ROUNDS = 3;
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

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

function getNvidiaClient() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) return null;
  return new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' });
}

function friendlyAIError(error) {
  const status = Number(error?.status || error?.statusCode || 0);
  if (status === 401 || status === 403) return 'NVIDIA AI rejected the server credentials. Check NVIDIA_API_KEY.';
  if (status === 429) return 'NVIDIA AI is temporarily rate-limited. Please wait a moment and try again.';
  if (status >= 500 || /timeout|timed out|network|fetch failed/i.test(String(error?.message || ''))) return 'NVIDIA AI is temporarily unavailable. Please try again.';
  return 'NVIDIA AI could not complete that request. Please try again.';
}

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

function trimTrailingSlash(value) {
  return String(value || '').replace(/\/+$/, '');
}

function getPublicBaseUrl(req) {
  const origin = trimTrailingSlash(req.get('origin'));
  if (origin) return origin;

  const configuredBaseUrl = trimTrailingSlash(process.env.BASE_URL);
  if (configuredBaseUrl) return configuredBaseUrl;

  const forwardedProto = String(req.get('x-forwarded-proto') || '').split(',')[0].trim();
  const proto = forwardedProto || req.protocol || 'http';
  return `${proto}://${req.get('host')}`;
}

function getPortfolioBaseYear() {
  return new Date().getFullYear();
}

function normalizePortfolioCalendarYear(value, fallback = getPortfolioBaseYear()) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 1900) {
    return getPortfolioBaseYear() + Math.min(99, Math.max(1, numeric || 1)) - 1;
  }
  return Math.min(getPortfolioBaseYear() + 99, Math.max(1900, Math.round(numeric)));
}

// Serve production React build only when it exists (avoids empty shell page)
if (fs.existsSync(BUILD_DIR)) {
  app.use(express.static(BUILD_DIR, {
    setHeaders: (res, filePath) => {
      const relativePath = path.relative(BUILD_DIR, filePath).replace(/\\/g, '/');
      if (relativePath.startsWith('static/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (path.basename(filePath) === 'favicon.png') {
        res.setHeader('Cache-Control', 'public, max-age=604800');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  }));
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
    timelineYear: normalizePortfolioCalendarYear(portfolio.timelineYear),
    updatedAt: portfolio.updatedAt || new Date().toISOString(),
    items: Array.isArray(portfolio.items)
      ? portfolio.items.map((item, index) => ({
          id: String(item?.id || `item_${index}`),
          type: String(item?.type || 'SIP'),
          configId: String(item?.configId || ''),
          configName: String(item?.configName || ''),
          resolvedConfig: item?.resolvedConfig && typeof item.resolvedConfig === 'object' ? item.resolvedConfig : null,
          startYear: normalizePortfolioCalendarYear(item?.startYear),
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
            timelineYear: normalizePortfolioCalendarYear(safe.homePortfolio?.timelineYear),
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
      timelineYear: normalizePortfolioCalendarYear(portfolio?.timelineYear),
      updatedAt: portfolio?.updatedAt || new Date().toISOString(),
      items: Array.isArray(portfolio?.items)
        ? portfolio.items.map((item, index) => ({
            id: String(item?.id || `item_${index}`),
            type: String(item?.type || 'SIP'),
            configId: String(item?.configId || ''),
            configName: String(item?.configName || ''),
            config: undefined,
            resolvedConfig: item?.resolvedConfig && typeof item.resolvedConfig === 'object' ? item.resolvedConfig : null,
            startYear: normalizePortfolioCalendarYear(item?.startYear),
          }))
        : [],
    })),
  };
}

function defaultAIState() {
  return { chats: [], goals: [], drafts: [], tokenUsage: { input: 0, output: 0, cached: 0 } };
}

function normalizeAIState(input) {
  const safe = input && typeof input === 'object' ? input : {};
  return {
    chats: Array.isArray(safe.chats) ? safe.chats.slice(0, 100).map((chat) => ({
      id: String(chat.id || crypto.randomUUID()),
      title: String(chat.title || 'New chat').slice(0, 100),
      type: String(chat.type || 'general'),
      pinned: Boolean(chat.pinned),
      createdAt: chat.createdAt || new Date().toISOString(),
      updatedAt: chat.updatedAt || new Date().toISOString(),
      summary: String(chat.summary || '').slice(0, 1800),
      messages: Array.isArray(chat.messages) ? chat.messages.slice(-30).map((message) => ({
        id: String(message.id || crypto.randomUUID()), role: message.role === 'assistant' ? 'assistant' : 'user',
        text: String(message.text || '').slice(0, 8000), createdAt: message.createdAt || new Date().toISOString(),
        actions: Array.isArray(message.actions) ? message.actions.slice(0, 6) : [], cards: Array.isArray(message.cards) ? message.cards.slice(0, 4) : [],
      })) : [],
      context: chat.context && typeof chat.context === 'object' ? chat.context : {},
    })) : [],
    goals: Array.isArray(safe.goals) ? safe.goals.slice(0, 100) : [],
    drafts: Array.isArray(safe.drafts) ? safe.drafts.slice(0, 100) : [],
    tokenUsage: safe.tokenUsage && typeof safe.tokenUsage === 'object' ? safe.tokenUsage : { input: 0, output: 0, cached: 0 },
  };
}

function getAIState(user) {
  user.ai = normalizeAIState(user.ai);
  return user.ai;
}

function compactResult(result) {
  return {
    summary: Array.isArray(result?.summary) ? result.summary.slice(0, 6).map(({ label, value, sub }) => ({ label, value, sub })) : [],
    assumptions: Array.isArray(result?.assumptions) ? result.assumptions.slice(0, 3) : [],
  };
}

function n(value, fallback = 0) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
function money(value) { return `₹${Math.round(n(value)).toLocaleString('en-IN')}`; }
function futureValueLumpsum({ amount = 0, rate = 12, years = 10 }) { return n(amount) * Math.pow(1 + n(rate) / 100, n(years)); }
function futureValueSip({ monthlyAmount = 0, rate = 12, years = 10 }) {
  const monthlyRate = n(rate) / 1200; const months = Math.max(0, Math.round(n(years) * 12));
  return monthlyRate === 0 ? n(monthlyAmount) * months : n(monthlyAmount) * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate);
}
function calculatorResult(kind, input = {}) {
  const rate = n(input.ratePercentage ?? input.rate ?? input.interestRate, 12);
  const years = Math.max(0, n(input.years, 10));
  if (kind === 'calculateSIP' || kind === 'calculateStepUpSIP' || kind === 'calculateGoal') {
    const monthlyAmount = n(input.monthlyAmount, 0); const initialLumpsum = n(input.initialLumpsum, 0);
    const value = futureValueSip({ monthlyAmount, rate, years }) + futureValueLumpsum({ amount: initialLumpsum, rate, years });
    const invested = monthlyAmount * years * 12 + initialLumpsum;
    return { summary: [{ label: kind === 'calculateGoal' ? 'Projected value' : 'Projected corpus', value: money(value) }, { label: 'Amount invested', value: money(invested) }, { label: 'Estimated growth', value: money(value - invested) }], assumptions: [`${rate}% annual return`, `${years} year horizon`] };
  }
  if (kind === 'calculateLumpsum') {
    const amount = n(input.amount ?? input.principal, 0); const value = futureValueLumpsum({ amount, rate, years });
    return { summary: [{ label: 'Maturity value', value: money(value) }, { label: 'Investment', value: money(amount) }, { label: 'Estimated growth', value: money(value - amount) }], assumptions: [`${rate}% annual return`, `${years} year horizon`] };
  }
  if (kind === 'calculateEMI') {
    const principal = n(input.loanAmount, 0); const months = Math.max(1, Math.round(years * 12)); const monthlyRate = rate / 1200;
    const emi = monthlyRate === 0 ? principal / months : principal * monthlyRate * Math.pow(1 + monthlyRate, months) / (Math.pow(1 + monthlyRate, months) - 1);
    return { summary: [{ label: 'Monthly EMI', value: money(emi) }, { label: 'Total interest', value: money(emi * months - principal) }, { label: 'Total payment', value: money(emi * months) }], assumptions: [`${rate}% fixed annual interest`, `${years} year tenure`] };
  }
  if (kind === 'calculateFD' || kind === 'calculatePPF') {
    const principal = n(input.principal ?? input.monthlyAmount * 12 * years, 0); const value = futureValueLumpsum({ amount: principal, rate, years });
    return { summary: [{ label: 'Estimated maturity', value: money(value) }, { label: 'Principal', value: money(principal) }, { label: 'Interest earned', value: money(value - principal) }], assumptions: [`${rate}% annual rate`, `${years} year term`] };
  }
  if (kind === 'calculateRD') {
    const value = futureValueSip({ monthlyAmount: n(input.monthlyDeposit ?? input.monthlyAmount, 0), rate, years });
    return { summary: [{ label: 'Estimated maturity', value: money(value) }, { label: 'Monthly deposit', value: money(n(input.monthlyDeposit ?? input.monthlyAmount, 0)) }], assumptions: [`${rate}% annual rate`, `${years} year term`] };
  }
  if (kind === 'calculateSWP') {
    const corpus = n(input.corpusAmount, 0); const monthly = n(input.monthlyWithdrawal, 0); const months = Math.max(1, Math.round(years * 12)); const mr = rate / 1200;
    const remaining = corpus * Math.pow(1 + mr, months) - monthly * ((Math.pow(1 + mr, months) - 1) / (mr || 1));
    return { summary: [{ label: 'Estimated remaining corpus', value: money(Math.max(0, remaining)) }, { label: 'Total withdrawals', value: money(monthly * months) }], assumptions: [`${rate}% annual return`, `${years} year withdrawal period`] };
  }
  return { summary: [{ label: 'Calculation', value: 'Supported through the selected calculator' }], assumptions: [] };
}

const CALCULATOR_TOOLS = ['calculateSIP', 'calculateStepUpSIP', 'calculateSWP', 'calculateLumpsum', 'calculateGoal', 'calculateRetirement', 'calculateEMI', 'calculateFD', 'calculateRD', 'calculatePPF', 'calculateGST', 'calculateTax'];
const AI_TOOLS = [
  ...CALCULATOR_TOOLS.map((name) => ({ type: 'function', name, description: `Run the deterministic ${name} calculator. Never estimate financial arithmetic yourself.`, parameters: { type: 'object', properties: { inputs: { type: 'object', additionalProperties: { type: ['number', 'string', 'boolean'] } } }, required: ['inputs'], additionalProperties: false } })),
  { type: 'function', name: 'getPortfolio', description: 'Load a compact summary of the user portfolio by id.', parameters: { type: 'object', properties: { portfolioId: { type: 'string' } }, required: ['portfolioId'], additionalProperties: false } },
  { type: 'function', name: 'getSavedPlans', description: 'List the user saved calculator configurations by calculator page.', parameters: { type: 'object', properties: { page: { type: 'string' } }, additionalProperties: false } },
  { type: 'function', name: 'getGoals', description: 'List the user saved financial goals.', parameters: { type: 'object', properties: {}, additionalProperties: false } },
  { type: 'function', name: 'createDraft', description: 'Prepare, but never save, a configuration, portfolio, or goal. The user must confirm separately.', parameters: { type: 'object', properties: { kind: { type: 'string', enum: ['configuration', 'portfolio', 'goal'] }, title: { type: 'string' }, payload: { type: 'object' } }, required: ['kind', 'title', 'payload'], additionalProperties: false } },
];

const NVIDIA_AI_TOOLS = AI_TOOLS.map((tool) => ({
  type: 'function',
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  },
}));

function contextDigest(user, context) {
  const settings = normalizeSettings(user.settings);
  const configs = Object.entries(user.configs || {}).flatMap(([page, entries]) => (entries || []).slice(0, 5).map((entry) => ({ id: entry.id, page, name: entry.name, config: entry.config, updatedAt: entry.updatedAt })));
  return { attached: context || {}, profile: { defaultInflationRate: settings.defaultInflationRate }, portfolios: settings.portfolios.map(({ id, name, updatedAt, items }) => ({ id, name, updatedAt, itemCount: items.length, items: items.slice(0, 8) })), configs: configs.slice(0, 20) };
}

function executeAITool(user, name, args) {
  if (CALCULATOR_TOOLS.includes(name)) return compactResult(calculatorResult(name, args.inputs));
  const settings = normalizeSettings(user.settings);
  if (name === 'getPortfolio') {
    const portfolio = settings.portfolios.find((item) => item.id === args.portfolioId);
    if (!portfolio) throw new Error('Portfolio not found.');
    return { id: portfolio.id, name: portfolio.name, itemCount: portfolio.items.length, timelineYear: portfolio.timelineYear, inflationAdjusted: portfolio.inflationAdjusted, inflationRate: portfolio.inflationRate, items: portfolio.items.slice(0, 20) };
  }
  if (name === 'getSavedPlans') return Object.entries(user.configs || {}).flatMap(([page, entries]) => page === args.page || !args.page ? (entries || []).map(({ id, name, config, updatedAt }) => ({ id, page, name, config, updatedAt })) : []).slice(0, 20);
  if (name === 'getGoals') return getAIState(user).goals.slice(0, 20);
  if (name === 'createDraft') {
    const state = getAIState(user); const draft = { id: crypto.randomUUID(), kind: args.kind, title: String(args.title).slice(0, 100), payload: args.payload || {}, createdAt: new Date().toISOString() };
    state.drafts.unshift(draft); return { draftId: draft.id, kind: draft.kind, title: draft.title, requiresConfirmation: true };
  }
  throw new Error('Tool is not registered.');
}

const AI_SYSTEM_INSTRUCTIONS = `You are PlanMyCapital AI, an educational financial planning assistant. Never do calculator, tax, loan, return, withdrawal, or portfolio arithmetic yourself: call a deterministic app tool. Use user data only through tools. Explain assumptions and scenarios; do not provide individualized buy/sell instructions. Create drafts only with createDraft and state that user confirmation is required. Keep responses concise.`;

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
      ai: defaultAIState(),
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
    url: `${getPublicBaseUrl(req)}/portfolio/${encodeURIComponent(slug)}`,
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

function findAIChat(user, chatId) {
  const chat = getAIState(user).chats.find((item) => item.id === chatId);
  if (!chat) throw new Error('Chat not found.');
  return chat;
}

function publicChat(chat, includeMessages = false) {
  const base = { id: chat.id, title: chat.title, type: chat.type, pinned: chat.pinned, createdAt: chat.createdAt, updatedAt: chat.updatedAt, summary: chat.summary, context: chat.context };
  return includeMessages ? { ...base, messages: chat.messages } : base;
}

function refreshChatSummary(chat) {
  const recent = chat.messages.slice(-6).map((message) => `${message.role}: ${message.text}`).join(' | ');
  chat.summary = recent.slice(-1600);
}

app.get('/api/ai/chats', requireAuth, asyncHandler(async (req, res) => {
  const query = String(req.query.q || '').trim().toLowerCase();
  const chats = getAIState(req.auth.user).chats
    .filter((chat) => !query || `${chat.title} ${chat.summary}`.toLowerCase().includes(query))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt) - new Date(a.updatedAt))
    .map((chat) => publicChat(chat));
  res.json({ chats });
}));

app.post('/api/ai/chats', requireAuth, asyncHandler(async (req, res) => {
  const state = getAIState(req.auth.user);
  const chat = { id: crypto.randomUUID(), title: String(req.body.title || 'New chat').slice(0, 100), type: String(req.body.type || 'general'), pinned: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), summary: '', messages: [], context: req.body.context && typeof req.body.context === 'object' ? req.body.context : {} };
  state.chats.unshift(chat);
  await updateUser(req.auth.user.username, { ai: state });
  res.status(201).json({ chat: publicChat(chat, true) });
}));

app.get('/api/ai/chats/:chatId', requireAuth, asyncHandler(async (req, res) => {
  res.json({ chat: publicChat(findAIChat(req.auth.user, req.params.chatId), true) });
}));

app.put('/api/ai/chats/:chatId', requireAuth, asyncHandler(async (req, res) => {
  const chat = findAIChat(req.auth.user, req.params.chatId);
  if (req.body.title !== undefined) chat.title = String(req.body.title || 'New chat').trim().slice(0, 100) || 'New chat';
  if (req.body.pinned !== undefined) chat.pinned = Boolean(req.body.pinned);
  chat.updatedAt = new Date().toISOString();
  await updateUser(req.auth.user.username, { ai: getAIState(req.auth.user) });
  res.json({ chat: publicChat(chat) });
}));

app.delete('/api/ai/chats/:chatId', requireAuth, asyncHandler(async (req, res) => {
  const state = getAIState(req.auth.user);
  const initialLength = state.chats.length;
  state.chats = state.chats.filter((chat) => chat.id !== req.params.chatId);
  if (state.chats.length === initialLength) return res.status(404).json({ message: 'Chat not found.' });
  state.drafts = state.drafts.filter((draft) => draft.chatId !== req.params.chatId);
  await updateUser(req.auth.user.username, { ai: state });
  res.json({ ok: true });
}));

app.post('/api/ai/chats/:chatId/messages', requireAuth, asyncHandler(async (req, res) => {
  const user = req.auth.user;
  const state = getAIState(user);
  const chat = findAIChat(user, req.params.chatId);
  const action = String(req.body.action || 'send');

  if (action === 'discard_draft') {
    state.drafts = state.drafts.filter((draft) => draft.id !== req.body.draftId);
    await updateUser(user.username, { ai: state });
    return res.json({ ok: true, chat: publicChat(chat, true) });
  }

  if (action === 'confirm_save') {
    const draft = state.drafts.find((item) => item.id === req.body.draftId && item.chatId === chat.id);
    if (!draft) return res.status(404).json({ message: 'Draft not found.' });
    if (draft.kind === 'configuration') {
      const page = String(draft.payload.page || 'sip');
      user.configs = user.configs || {}; user.configs[page] = user.configs[page] || [];
      user.configs[page].unshift({ id: crypto.randomUUID(), name: draft.title, config: draft.payload.config || draft.payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    } else if (draft.kind === 'portfolio') {
      user.settings = normalizeSettings(user.settings); user.settings.portfolios.unshift({ id: crypto.randomUUID(), name: draft.title, items: Array.isArray(draft.payload.items) ? draft.payload.items : [], inflationAdjusted: false, inflationRate: user.settings.defaultInflationRate, timelineYear: getPortfolioBaseYear(), updatedAt: new Date().toISOString() });
    } else if (draft.kind === 'goal') {
      state.goals.unshift({ id: crypto.randomUUID(), title: draft.title, ...draft.payload, createdAt: new Date().toISOString() });
    }
    state.drafts = state.drafts.filter((item) => item.id !== draft.id);
    chat.messages.push({ id: crypto.randomUUID(), role: 'assistant', text: `${draft.title} has been saved.`, createdAt: new Date().toISOString(), actions: [], cards: [] });
    refreshChatSummary(chat); chat.updatedAt = new Date().toISOString();
    await updateUser(user.username, { ai: state, configs: user.configs, settings: user.settings });
    return res.json({ chat: publicChat(chat, true), saved: { kind: draft.kind, title: draft.title } });
  }

  const message = String(req.body.message || '').trim();
  if (!message) return res.status(400).json({ message: 'Message is required.' });
  const nvidia = getNvidiaClient();
  const now = new Date().toISOString();
  chat.context = { ...chat.context, ...(req.body.context && typeof req.body.context === 'object' ? req.body.context : {}) };
  chat.messages.push({ id: crypto.randomUUID(), role: 'user', text: message.slice(0, 8000), createdAt: now, actions: [], cards: [] });
  if (!nvidia) {
    const providerMessage = 'PlanMyCapital AI is not configured on the server.';
    chat.messages.push({ id: crypto.randomUUID(), role: 'assistant', text: providerMessage, createdAt: new Date().toISOString(), actions: [], cards: [] });
    refreshChatSummary(chat); chat.updatedAt = new Date().toISOString();
    await updateUser(user.username, { ai: state });
    return res.status(503).json({ message: providerMessage, chat: publicChat(chat, true) });
  }
  const transcript = chat.messages.slice(-20).map((item) => ({ role: item.role, content: item.text }));
  let input = [
    { role: 'system', content: AI_SYSTEM_INSTRUCTIONS },
    { role: 'system', content: `Compact user context: ${JSON.stringify(contextDigest(user, chat.context))}` },
    { role: 'system', content: `Conversation memory: ${chat.summary || 'No prior summary.'}` },
    ...transcript,
  ];
  const cards = [];
  let response;
  try {
    for (let round = 0; round < AI_MAX_TOOL_ROUNDS; round += 1) {
      response = await nvidia.chat.completions.create({
        model: AI_MODEL,
        messages: input,
        tools: NVIDIA_AI_TOOLS,
        tool_choice: 'auto',
        temperature: 0.2,
        max_tokens: 768,
        reasoning_effort: 'none',
      });
      const assistantMessage = response.choices?.[0]?.message;
      const calls = assistantMessage?.tool_calls || [];
      if (calls.length === 0) break;
      input = [...input, assistantMessage];
      const outputs = calls.map((call) => {
        try {
          const name = call.function?.name;
          const result = executeAITool(user, name, JSON.parse(call.function?.arguments || '{}'));
          if (name === 'createDraft') {
            const draft = state.drafts[0]; if (draft) { draft.chatId = chat.id; cards.push({ type: 'draft', draftId: draft.id, kind: draft.kind, title: draft.title }); }
          } else if (CALCULATOR_TOOLS.includes(name)) cards.push({ type: 'calculator', title: name, result });
          return { role: 'tool', tool_call_id: call.id, content: JSON.stringify(result) };
        } catch (error) { return { role: 'tool', tool_call_id: call.id, content: JSON.stringify({ error: error.message || 'Tool could not run.' }) }; }
      });
      input = [...input, ...outputs];
    }
  } catch (error) {
    const providerMessage = friendlyAIError(error);
    chat.messages.push({ id: crypto.randomUUID(), role: 'assistant', text: providerMessage, createdAt: new Date().toISOString(), actions: [], cards: [] });
    refreshChatSummary(chat); chat.updatedAt = new Date().toISOString();
    await updateUser(user.username, { ai: state });
    return res.status(Number(error?.status) === 429 ? 429 : 502).json({ message: providerMessage, chat: publicChat(chat, true) });
  }
  const answer = String(response?.choices?.[0]?.message?.content || 'I could not complete that request. Please try again.').trim();
  const usage = response?.usage || {};
  state.tokenUsage.input += Number(usage.input_tokens || 0); state.tokenUsage.output += Number(usage.output_tokens || 0); state.tokenUsage.cached += Number(usage.input_tokens_details?.cached_tokens || 0);
  chat.messages.push({ id: crypto.randomUUID(), role: 'assistant', text: answer, createdAt: new Date().toISOString(), actions: cards.some((card) => card.type === 'draft') ? [{ label: 'Save draft', action: 'confirm_save' }] : [], cards });
  if (chat.title === 'New chat') chat.title = message.slice(0, 58);
  refreshChatSummary(chat); chat.updatedAt = new Date().toISOString();
  await updateUser(user.username, { ai: state });
  res.json({ chat: publicChat(chat, true), usage: { input: usage.input_tokens || 0, output: usage.output_tokens || 0, cached: usage.input_tokens_details?.cached_tokens || 0 } });
}));

app.get('/api/ai/test', asyncHandler(async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
    }
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Reply with exactly: PlanMyCapital AI is working.',
    });
    res.json({ success: true, response: response.text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

app.get('/api/ai/nvidia-test', asyncHandler(async (req, res) => {
  try {
    const apiKey = process.env.NVIDIA_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'NVIDIA_API_KEY is not configured on the server.' });
    }
    const nvidia = new OpenAI({ apiKey, baseURL: 'https://integrate.api.nvidia.com/v1' });
    const completion = await nvidia.chat.completions.create({
      model: 'nvidia/nvidia-nemotron-nano-9b-v2',
      messages: [{ role: 'user', content: 'Reply with exactly: PlanMyCapital NVIDIA AI is working.' }],
      temperature: 0,
      max_tokens: 512,
      reasoning_effort: 'none',
    });
    const reply = (completion.choices?.[0]?.message?.content ?? '').trim();
    res.json({ success: true, response: reply });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));
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
      url: `${getPublicBaseUrl(req)}/${page}/${username}/config/${encodeURIComponent(configName)}`,
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
