import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { hostname } from 'os';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const PEERS_FILE = join(DATA_DIR, 'peers.json');
const REGISTRY_FILE = join(DATA_DIR, 'mothub_registry.json');
const NODE_IDENTITY_FILE = join(DATA_DIR, 'node-identity.json');

const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL_MS || '60000', 10);
const NODE_PUBLIC_URL = process.env.NODE_PUBLIC_URL || 'http://localhost:8080';
const NODE_NAME = process.env.NODE_NAME || '';
const SEED_NODES = (process.env.SEED_NODES || '').split(',').filter(Boolean);
const PEER_TIMEOUT = 30000;
const PRUNE_AFTER_CYCLES = 3;

let nodeIdentity = null;
let syncInterval = null;

// --- Node identity ---

function loadOrCreateIdentity() {
  if (existsSync(NODE_IDENTITY_FILE)) {
    try {
      return JSON.parse(readFileSync(NODE_IDENTITY_FILE, 'utf-8'));
    } catch {}
  }
  const identity = {
    node_id: process.env.NODE_ID || uuidv4(),
    name: NODE_NAME || hostname(),
    public_url: NODE_PUBLIC_URL,
    version: '1.0.0',
    created_at: new Date().toISOString()
  };
  writeFileSync(NODE_IDENTITY_FILE, JSON.stringify(identity, null, 2));
  return identity;
}

// --- Peer store ---

function readPeers() {
  try {
    return JSON.parse(readFileSync(PEERS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

function writePeers(peers) {
  writeFileSync(PEERS_FILE, JSON.stringify(peers, null, 2));
}

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

// --- Sync protocol ---

async function fetchPeerInfo(peerUrl) {
  try {
    const resp = await fetch(`${peerUrl}/api/v1/node/info`, {
      signal: AbortSignal.timeout(PEER_TIMEOUT)
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

async function fetchPeerRegistry(peerUrl) {
  try {
    const resp = await fetch(`${peerUrl}/api/v1/sync/registry`, {
      signal: AbortSignal.timeout(PEER_TIMEOUT)
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch {
    return null;
  }
}

async function pushRegistry(peerUrl, entries) {
  try {
    const resp = await fetch(`${peerUrl}/api/v1/sync/registry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registry: entries, source_node: nodeIdentity.node_id }),
      signal: AbortSignal.timeout(PEER_TIMEOUT)
    });
    return resp.ok;
  } catch {
    return false;
  }
}

function mergeRegistries(local, remote, sourceNodeId) {
  const merged = new Map(local.map(a => [a.node_id, a]));
  let importedCount = 0;

  for (const entry of remote) {
    if (!entry.node_id) continue;
    const existing = merged.get(entry.node_id);
    if (!existing) {
      merged.set(entry.node_id, {
        ...entry,
        source_node: sourceNodeId,
        synced_at: new Date().toISOString()
      });
      importedCount++;
    } else {
      const localTime = new Date(existing.lastHeartbeat || existing.updated_at || 0).getTime();
      const remoteTime = new Date(entry.lastHeartbeat || entry.updated_at || 0).getTime();
      if (remoteTime > localTime) {
        merged.set(entry.node_id, {
          ...entry,
          source_node: existing.source_node || sourceNodeId,
          synced_at: new Date().toISOString()
        });
        importedCount++;
      } else if (remoteTime === localTime) {
        const localCoh = existing.resonance_field?.coherence || 0;
        const remoteCoh = entry.resonance_field?.coherence || 0;
        if (remoteCoh > localCoh) {
          merged.set(entry.node_id, {
            ...entry,
            source_node: existing.source_node || sourceNodeId,
            synced_at: new Date().toISOString()
          });
          importedCount++;
        }
      }
    }
  }

  return { registry: Array.from(merged.values()), importedCount };
}

// --- Sync loop ---

export async function runSyncCycle(extraPeers = []) {
  const peers = readPeers();
  const now = Date.now();

  // Combine seed nodes, known peers, and extra sources
  const allUrls = new Set([
    ...SEED_NODES,
    ...Object.keys(peers),
    ...extraPeers
  ]);

  const results = { polled: 0, alive: 0, imported: 0, pruned: 0 };

  for (const url of allUrls) {
    results.polled++;

    // Skip self
    if (url === NODE_PUBLIC_URL) continue;

    const info = await fetchPeerInfo(url);
    if (!info) {
      // Mark as dead
      if (peers[url]) {
        peers[url].missedCycles = (peers[url].missedCycles || 0) + 1;
        if (peers[url].missedCycles >= PRUNE_AFTER_CYCLES) {
          delete peers[url];
          results.pruned++;
        }
      }
      continue;
    }

    results.alive++;
    peers[url] = {
      node_id: info.node_id,
      name: info.name || info.node_id,
      public_url: info.public_url || url,
      version: info.version,
      last_seen: new Date().toISOString(),
      missedCycles: 0
    };

    // Pull remote registry
    const remote = await fetchPeerRegistry(url);
    if (remote && Array.isArray(remote.registry)) {
      const local = readRegistry();
      const { registry, importedCount } = mergeRegistries(local, remote.registry, info.node_id);
      if (importedCount > 0) {
        writeRegistry(registry);
        results.imported += importedCount;
      }
    }

    // Push our registry
    const local = readRegistry();
    if (local.length > 0) {
      await pushRegistry(url, local);
    }
  }

  writePeers(peers);

  if (results.polled > 0) {
    console.log(`[sync] polled=${results.polled} alive=${results.alive} imported=${results.imported} pruned=${results.pruned}`);
  }

  return results;
}

// --- Public API helpers ---

export function getNodeInfo() {
  if (!nodeIdentity) {
    nodeIdentity = loadOrCreateIdentity();
  }
  const registry = readRegistry();
  return {
    ...nodeIdentity,
    registry_size: registry.length,
    uptime_secs: Math.floor((Date.now() - new Date(nodeIdentity.created_at).getTime()) / 1000)
  };
}

export function getPeers() {
  const peers = readPeers();
  return Object.entries(peers).map(([url, info]) => ({
    url,
    node_id: info.node_id,
    name: info.name,
    version: info.version,
    last_seen: info.last_seen
  }));
}

export function getRegistryForSync() {
  const registry = readRegistry();
  return { registry, source_node: nodeIdentity?.node_id || 'unknown' };
}

export function applyRemoteRegistry(remoteRegistry, sourceNodeId) {
  if (!Array.isArray(remoteRegistry)) return { imported: 0 };
  const local = readRegistry();
  const { registry, importedCount } = mergeRegistries(local, remoteRegistry, sourceNodeId);
  if (importedCount > 0) {
    writeRegistry(registry);
  }
  return { imported: importedCount };
}

// --- Lifecycle ---

export function startSyncEngine(extraPeerSource = null) {
  nodeIdentity = loadOrCreateIdentity();

  console.log(`[sync] node_id=${nodeIdentity.node_id} name=${nodeIdentity.name} interval=${SYNC_INTERVAL}ms`);

  // Run immediately, then on interval
  setTimeout(() => runSyncCycle(extraPeerSource ? extraPeerSource() : []), 3000);
  syncInterval = setInterval(() => runSyncCycle(extraPeerSource ? extraPeerSource() : []), SYNC_INTERVAL);
  syncInterval.unref();
}
