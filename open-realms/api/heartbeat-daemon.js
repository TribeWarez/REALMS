import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const REGISTRY_FILE = join(DATA_DIR, 'mothub_registry.json');
const HEARTBEATS_FILE = join(DATA_DIR, 'heartbeats.json');

function readRegistry() {
  try { return JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8')); } catch { return []; }
}

export function startHeartbeatDaemon(intervalMs = 60000) {
  function beat() {
    try {
      const registry = readRegistry();
      if (registry.length === 0) return;
      const hb = JSON.parse(readFileSync(HEARTBEATS_FILE, 'utf-8'));
      const now = Date.now();
      for (const node of registry) {
        hb[node.node_id] = now;
      }
      writeFileSync(HEARTBEATS_FILE, JSON.stringify(hb, null, 2));
    } catch {}
  }

  beat();
  const interval = setInterval(beat, intervalMs);
  interval.unref();
  console.log(`[heartbeat] daemon active — heartbeating all registered agents every ${intervalMs}ms`);
  return interval;
}
