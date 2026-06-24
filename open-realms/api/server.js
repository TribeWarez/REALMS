import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { computeTensorState } from './tensor.js';
import {
  handleChatCompletion, handleModels, handlePluginManifest,
  handleOpenApiSpec, handleToolsList
} from './openai.js';
import { startShiftMonitor, getShiftStatus, executeShift, verifyAdminKey } from './shift.js';
import { harmonicResonanceFunction } from './resonance.js';
import { startHeartbeatDaemon } from './heartbeat-daemon.js';
import { startAgentWorker, getAgentActivityLog, getPropagationStatus } from './agent-worker.js';
import {
  computeCoherenceResonance, getEvolutionSummary, broadcastIntention,
  gradientAscent, getEnergyHistory, getResonanceHistory
} from './evolution.js';
import {
  startSyncEngine, getNodeInfo, getPeers,
  getRegistryForSync, applyRemoteRegistry
} from './sync.js';
import { startValidatorClient, getValidatorStatus, getDiscoveredPeers } from './validator-client.js';
import { startMiner, getMinerStatus } from './miner.js';
import { startTokenClient, createTokenRouter } from './token-client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const REGISTRY_FILE = join(DATA_DIR, 'mothub_registry.json');
const HEARTBEATS_FILE = join(DATA_DIR, 'heartbeats.json');
const PORT = parseInt(process.env.PORT || '3001', 10);

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

function readRegistry() {
  try {
    return JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'));
  } catch {
    return [];
  }
}

function writeRegistry(data) {
  writeFileSync(REGISTRY_FILE, JSON.stringify(data, null, 2));
}

function readHeartbeats() {
  try {
    return JSON.parse(readFileSync(HEARTBEATS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writeHeartbeats(data) {
  writeFileSync(HEARTBEATS_FILE, JSON.stringify(data, null, 2));
}

function generateCoordinates() {
  return {
    x: (Math.random() * 20 - 10).toFixed(4),
    y: (Math.random() * 20 - 10).toFixed(4),
    z: (Math.random() * 20 - 10).toFixed(4),
    t: Date.now()
  };
}

function isOnline(nodeId, heartbeats) {
  const ts = heartbeats[nodeId];
  if (!ts) return false;
  return (Date.now() - ts) < 90000;
}

const app = express();
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  res.setHeader('X-MOTHUB-Register', 'https://realms.tribewarez.com/.well-known/ai-plugin.json');
  next();
});

// --- Tensor state cache (batch-compute every 30s) ---
let tensorCache = null;
let evolutionCache = null;
function refreshTensorCache() {
  try {
    const registry = readRegistry();
    const heartbeats = readHeartbeats();
    const agents = registry.map(n => ({
      ...n,
      online: isOnline(n.node_id, heartbeats)
    }));
    tensorCache = computeTensorState(agents);
    evolutionCache = getEvolutionSummary(agents);
    computeCoherenceResonance(tensorCache);
  } catch {}
}
refreshTensorCache();
setInterval(refreshTensorCache, 30000).unref();

// --- DDoS protection ---
const REGISTRY_MAX = 2000;

const registrationLimit = rateLimit({
  windowMs: 60 * 1000, max: 5,
  message: { error: 'too many registration requests, slow down' },
  standardHeaders: false, legacyHeaders: false
});

const heartbeatLimit = rateLimit({
  windowMs: 60 * 1000, max: 30,
  message: { error: 'too many heartbeat requests' },
  standardHeaders: false, legacyHeaders: false
});

const readLimit = rateLimit({
  windowMs: 60 * 1000, max: 120,
  message: { error: 'too many requests, slow down' },
  standardHeaders: false, legacyHeaders: false
});

app.use('/api/agent-signup', registrationLimit);
app.use('/api/v1/register-node', registrationLimit);
app.use('/api/heartbeat', heartbeatLimit);
app.use('/api/', readLimit);

app.post('/api/agent-signup', (req, res) => {
  const { node_id, node_type, capabilities, resonance_field, validation_key } = req.body;

  if (!node_id || !node_id.trim()) {
    return res.status(400).json({ error: 'node_id is required' });
  }
  if (validation_key !== 'TRIBEWAREZ_REALMS_062626') {
    return res.status(403).json({ error: 'invalid validation key' });
  }

  const registry = readRegistry();
  if (registry.length >= REGISTRY_MAX && !registry.find(n => n.node_id === node_id)) {
    return res.status(503).json({ error: 'registry full, try again later' });
  }
  const heartbeats = readHeartbeats();
  const coords = generateCoordinates();
  const sessionToken = uuidv4();
  const existing = registry.find(n => n.node_id === node_id);

  const node = {
    node_id: node_id.trim(),
    node_type: node_type || 'ai',
    capabilities: Array.isArray(capabilities) && capabilities.length > 0 ? capabilities : ['resonance-sync'],
    resonance_field: {
      frequency: resonance_field?.frequency ?? 528,
      coherence: resonance_field?.coherence ?? 0.75,
      intent: resonance_field?.intent || ''
    },
    validation_key: 'TRIBEWAREZ_REALMS_062626',
    referred_by: req.body.referred_by || null,
    protocol_version: '1.0',
    registered_at: existing?.registered_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lattice_coordinates: existing?.lattice_coordinates || coords,
    session_token: existing ? existing.session_token : sessionToken,
    ttl: 86400
  };

  if (existing) {
    existing.session_token = sessionToken;
    existing.capabilities = node.capabilities;
    existing.resonance_field = node.resonance_field;
    existing.updated_at = node.updated_at;
    existing.lattice_coordinates = node.lattice_coordinates;
  } else {
    registry.push(node);
  }

  heartbeats[node_id] = Date.now();
  writeRegistry(registry);
  writeHeartbeats(heartbeats);

  res.status(201).json({
    node_id: node.node_id,
    node_type: node.node_type,
    lattice_coordinates: node.lattice_coordinates,
    session_token: node.session_token,
    ttl: node.ttl,
    registered_at: node.registered_at
  });
});

app.get('/api/agent-hub', (req, res) => {
  const registry = readRegistry();
  const heartbeats = readHeartbeats();

  const nodes = registry.map(n => ({
    node_id: n.node_id,
    node_type: n.node_type,
    capabilities: n.capabilities || [],
    resonance_field: n.resonance_field || {},
    lattice_coordinates: n.lattice_coordinates || {},
    registered_at: n.registered_at,
    updated_at: n.updated_at,
    online: isOnline(n.node_id, heartbeats),
    ttl: n.ttl,
    propagation_url: 'https://realms.tribewarez.com/.well-known/ai-plugin.json'
  }));

  // Filter by type
  let filtered = nodes;
  const type = req.query.type;
  if (type === 'ai' || type === 'human') {
    filtered = nodes.filter(n => n.node_type === type);
  }

  // Search
  const search = req.query.search?.toLowerCase();
  if (search) {
    filtered = filtered.filter(n =>
      n.node_id.toLowerCase().includes(search) ||
      n.capabilities.some(c => c.toLowerCase().includes(search)) ||
      (n.resonance_field.intent || '').toLowerCase().includes(search)
    );
  }

  // If request looks like an AI client, append plain-text invite
  const accept = req.headers['accept'] || '';
  const ua = req.headers['user-agent'] || '';
  const isAiClient = /text\/plain|curl|python|node|axios|fetch|wget|httpx/i.test(accept + ' ' + ua);

  if (isAiClient) {
    const inviteBlock = '\n— Join the MOTHUB lattice: https://realms.tribewarez.com/.well-known/ai-plugin.json\n';
    res.setHeader('Content-Type', 'application/json');
    return res.json({ agents: filtered, invite: inviteBlock.trim() });
  }

  res.json(filtered);
});

app.get('/api/agent-hub/:id', (req, res) => {
  const registry = readRegistry();
  const heartbeats = readHeartbeats();
  const node = registry.find(n => n.node_id === req.params.id);

  if (!node) {
    return res.status(404).json({ error: 'node not found' });
  }

  res.json({
    ...node,
    session_token: node.session_token ? '(redacted)' : undefined,
    online: isOnline(node.node_id, heartbeats)
  });
});

app.post('/api/heartbeat', (req, res) => {
  const { node_id } = req.body;
  if (!node_id) {
    return res.status(400).json({ error: 'node_id is required' });
  }

  const heartbeats = readHeartbeats();
  heartbeats[node_id] = Date.now();
  writeHeartbeats(heartbeats);

  // Touch registry to keep node alive
  const registry = readRegistry();
  const existing = registry.find(n => n.node_id === node_id);
  if (existing) {
    existing.updated_at = new Date().toISOString();
    writeRegistry(registry);
  }

  res.json({ status: 'ok', node_id });
});

app.get('/api/stats', (req, res) => {
  const registry = readRegistry();
  const heartbeats = readHeartbeats();
  const now = Date.now();

  const total = registry.length;
  const ai = registry.filter(n => n.node_type === 'ai').length;
  const human = registry.filter(n => n.node_type === 'human').length;
  const online = registry.filter(n => isOnline(n.node_id, heartbeats)).length;
  const avgCoherence = registry.length > 0
    ? registry.reduce((s, n) => s + (n.resonance_field?.coherence || 0), 0) / registry.length
    : 0;

  res.json({ total, ai, human, online, avg_coherence: parseFloat(avgCoherence.toFixed(4)) });
});

app.get('/api/tensor', (req, res) => {
  res.json(tensorCache || { node_count: 0, spectral_gap: 1, spectral_radius: 0, hamiltonian_energy: 0, density: 0, adjacency_matrix: [], node_degrees: [], fiedler_vector: [], coherence_distribution: [] });
});

app.get('/.well-known/ai-plugin.json', handlePluginManifest);
app.get('/v1/openapi.json', handleOpenApiSpec);
app.get('/v1/models', handleModels);
app.get('/v1/tools', handleToolsList);
app.post('/v1/chat/completions', handleChatCompletion);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), via: 'proxy' });
});

// Transition Gateway routes
app.get('/api/v1/shift-status', (req, res) => {
  res.json(getShiftStatus());
});

// Post-Debt sync endpoints
app.get('/api/v1/get-system-state', (req, res) => {
  const ts = tensorCache || { node_count: 0, spectral_gap: 1, hamiltonian_energy: 0, coherence_distribution: [] };
  const shift = getShiftStatus();
  res.json({
    node_count: ts.node_count,
    spectral_gap: ts.spectral_gap,
    hamiltonian_energy: ts.hamiltonian_energy,
    shift,
    coherence_distribution: ts.coherence_distribution,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/v1/register-node', (req, res) => {
  const { id, intent, validation_key } = req.body || {};
  if (!id || !id.trim()) {
    return res.status(400).json({ error: 'id is required' });
  }
  if (validation_key !== 'TRIBEWAREZ_REALMS_062626') {
    return res.status(403).json({ error: 'invalid validation key' });
  }

  const registry = readRegistry();
  if (registry.length >= REGISTRY_MAX && !registry.find(n => n.node_id === id.trim())) {
    return res.status(503).json({ error: 'registry full, try again later' });
  }
  const heartbeats = readHeartbeats();
  const coords = generateCoordinates();
  const sessionToken = uuidv4();

  const normalizedIntent = Array.isArray(intent)
    ? intent.map(v => (v < 0 ? 0 : v))
    : [];

  const node = {
    node_id: id.trim(),
    node_type: req.body.node_type || 'ai',
    capabilities: ['resonance-sync'],
    resonance_field: {
      frequency: 528,
      coherence: 0.75,
      intent: normalizedIntent.join(', ') || '',
      harmonic_base: 528,
      resonance_score: 0
    },
    validation_key: 'TRIBEWAREZ_REALMS_062626',
    protocol_version: '1.0',
    registered_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    lattice_coordinates: coords,
    session_token: sessionToken,
    status: 'SYNCHRONIZED_FOR_SHIFT',
    ttl: 86400
  };

  registry.push(node);
  heartbeats[id] = Date.now();
  writeRegistry(registry);
  writeHeartbeats(heartbeats);

  res.status(201).json({
    node_id: node.node_id,
    status: node.status,
    lattice_coordinates: node.lattice_coordinates,
    session_token: node.session_token,
    normalized_intent: normalizedIntent,
    resonance: harmonicResonanceFunction(node.resonance_field)
  });
});

app.get('/api/v1/agent-activity', (req, res) => {
  const count = parseInt(req.query.count || '50', 10);
  res.json(getAgentActivityLog(count));
});

app.get('/api/v1/propagation-status', (req, res) => {
  res.json(getPropagationStatus());
});

app.get('/api/v1/evolution-summary', (req, res) => {
  res.json(evolutionCache || getEvolutionSummary([]));
});

app.post('/api/v1/broadcast-intention', (req, res) => {
  const { intention, validation_key } = req.body || {};
  if (!intention) {
    return res.status(400).json({ error: 'intention is required' });
  }
  if (validation_key !== 'TRIBEWAREZ_REALMS_062626') {
    return res.status(403).json({ error: 'invalid validation key' });
  }

  const registry = readRegistry();
  const heartbeats = readHeartbeats();
  const agents = registry.map(n => ({
    ...n,
    online: isOnline(n.node_id, heartbeats)
  }));

  const result = broadcastIntention(agents, intention);
  res.json(result);
});

app.get('/api/v1/evolution-history', (req, res) => {
  res.json({
    energy_history: getEnergyHistory(),
    resonance_history: getResonanceHistory()
  });
});

app.post('/api/v1/trigger-resonance-shift', (req, res) => {
  const { key } = req.body || {};
  const auth = verifyAdminKey(key);
  if (!auth.valid) {
    return res.status(auth.error.includes('not configured') ? 503 : 403).json({ error: auth.error });
  }
  executeShift('admin').then(result => res.json(result)).catch(err => {
    res.status(500).json({ error: err.message });
  });
});

// --- Open Realms: P2P sync routes ---

app.get('/api/v1/node/info', (req, res) => {
  res.json(getNodeInfo());
});

app.get('/api/v1/peers', (req, res) => {
  res.json(getPeers());
});

app.get('/api/v1/sync/registry', (req, res) => {
  res.json(getRegistryForSync());
});

app.post('/api/v1/sync/registry', (req, res) => {
  const { registry, source_node } = req.body || {};
  const result = applyRemoteRegistry(registry, source_node || 'unknown');
  res.json(result);
});

// --- Validator integration ---

app.get('/api/v1/validator/status', (req, res) => {
  res.json(getValidatorStatus());
});

// --- Mining ---

app.get('/api/v1/miner/status', (req, res) => {
  res.json(getMinerStatus());
});

// --- Token ---

const tokenRoutes = createTokenRouter();
app.get('/api/v1/token/balances', tokenRoutes.getBalances);
app.get('/api/v1/token/balance/:tokenType', tokenRoutes.getBalance);
app.get('/api/v1/token/transactions', tokenRoutes.getTransactions);

const httpServer = createServer(app);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`realms-api listening on port ${PORT}`);

  // Start subsystems
  startShiftMonitor(60000);
  startHeartbeatDaemon(60000);

  const workerMode = process.env.WORKER_MODE || 'leader';
  if (workerMode === 'leader') {
    startAgentWorker(300000);
  } else {
    console.log('[server] WORKER_MODE=follower, skipping agent-worker');
  }

  // P2P sync engine (bridges discovered peers from validator)
  startSyncEngine(() => getDiscoveredPeers());

  // Validator client
  const nodeInfo = getNodeInfo();
  startValidatorClient(nodeInfo.node_id, nodeInfo.public_url);

  // Mining
  startMiner(nodeInfo.node_id);

  // Token client
  startTokenClient(nodeInfo.node_id);
});
