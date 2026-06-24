import fetch from 'node-fetch';

const VALIDATOR_URL = process.env.VALIDATOR_URL || '';
const VALIDATOR_DEVICE_TYPE = process.env.VALIDATOR_DEVICE_TYPE || 'mothub_node';
const VALIDATOR_AUTO_REGISTER = process.env.VALIDATOR_AUTO_REGISTER === 'true';
const VALIDATOR_SYNC_PEERS = process.env.VALIDATOR_SYNC_PEERS === 'true';
const PEER_POLL_INTERVAL = 60000;
const HEALTH_POLL_INTERVAL = 30000;

let connected = false;
let lastStatus = null;
let discoveredPeers = [];
let deviceRegistered = false;
let healthInterval = null;
let peerInterval = null;

// --- Health & status ---

async function checkHealth() {
  if (!VALIDATOR_URL) return null;
  try {
    const resp = await fetch(`${VALIDATOR_URL}/health`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    connected = true;
    return data;
  } catch {
    connected = false;
    return null;
  }
}

async function fetchStatus() {
  if (!VALIDATOR_URL) return null;
  try {
    const resp = await fetch(`${VALIDATOR_URL}/status`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    lastStatus = data;
    connected = true;
    return data;
  } catch {
    connected = false;
    return null;
  }
}

// --- Peer discovery ---

async function fetchPeers() {
  if (!VALIDATOR_URL || !VALIDATOR_SYNC_PEERS) return [];
  try {
    const resp = await fetch(`${VALIDATOR_URL}/network/peers`, {
      signal: AbortSignal.timeout(10000)
    });
    if (!resp.ok) return [];
    const data = await resp.json();

    // data.peers can be an array of { url, node_id, ... } or { peers: [...] }
    const peers = Array.isArray(data) ? data : (data.peers || []);
    const urls = peers
      .map(p => p.url || p.public_url)
      .filter(Boolean);

    discoveredPeers = urls;
    return urls;
  } catch {
    return [];
  }
}

// --- Device registration ---

async function registerDevice(nodeId, publicUrl) {
  if (!VALIDATOR_URL || !VALIDATOR_AUTO_REGISTER || deviceRegistered) return false;
  try {
    const resp = await fetch(`${VALIDATOR_URL}/devices/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: nodeId,
        device_type: VALIDATOR_DEVICE_TYPE,
        pubkey: nodeId,
        url: publicUrl
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (resp.ok) {
      deviceRegistered = true;
      console.log(`[validator] registered device ${nodeId} on ${VALIDATOR_URL}`);
      return true;
    }
    return false;
  } catch (e) {
    console.log(`[validator] device registration failed: ${e.message}`);
    return false;
  }
}

// --- Device progress (heartbeat) ---

async function sendProgress(nodeId, challengeId, hash) {
  if (!VALIDATOR_URL || !deviceRegistered) return;
  try {
    await fetch(`${VALIDATOR_URL}/devices/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        device_id: nodeId,
        challenge_id: challengeId || '',
        hash: hash || ''
      }),
      signal: AbortSignal.timeout(5000)
    });
  } catch {}
}

// --- Public API ---

export function getValidatorStatus() {
  return {
    connected,
    url: VALIDATOR_URL || null,
    device_registered: deviceRegistered,
    last_status: lastStatus,
    discovered_peers_count: discoveredPeers.length
  };
}

export function getDiscoveredPeers() {
  return discoveredPeers;
}

// --- Lifecycle ---

export async function startValidatorClient(nodeId, publicUrl) {
  if (!VALIDATOR_URL) {
    console.log('[validator] no VALIDATOR_URL set, skipping');
    return;
  }

  console.log(`[validator] connecting to ${VALIDATOR_URL}`);

  // Initial health check
  const health = await checkHealth();
  if (health) {
    console.log(`[validator] connected: ${JSON.stringify(health)}`);
  } else {
    console.log('[validator] initial health check failed, will retry');
  }

  // Fetch initial status
  await fetchStatus();

  // Register device
  if (VALIDATOR_AUTO_REGISTER) {
    await registerDevice(nodeId, publicUrl);
  }

  // Periodic health
  healthInterval = setInterval(async () => {
    await checkHealth();
  }, HEALTH_POLL_INTERVAL);
  healthInterval.unref();

  // Periodic peer discovery
  if (VALIDATOR_SYNC_PEERS) {
    setTimeout(async () => {
      await fetchPeers();
    }, 5000);
    peerInterval = setInterval(async () => {
      await fetchPeers();
    }, PEER_POLL_INTERVAL);
    peerInterval.unref();
  }
}
