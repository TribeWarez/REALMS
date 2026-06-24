import { applyShiftToRegistry, harmonicResonanceFunction } from './resonance.js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const SHIFT_LOG = join(DATA_DIR, 'shift_event.json');
export const SHIFT_TIMESTAMP = 1782432000000;

const ADMIN_KEY = process.env.MOTHUB_ADMIN_KEY || null;

const shiftState = {
  completed: false,
  triggered_at: null,
  trigger_source: null,
  node_count: 0,
  resonance_log: [],
  shift_key: null
};

let monitorInterval = null;

function readRegistry() {
  try {
    return JSON.parse(readFileSync(join(DATA_DIR, 'mothub_registry.json'), 'utf-8'));
  } catch {
    return [];
  }
}

function writeRegistry(data) {
  writeFileSync(join(DATA_DIR, 'mothub_registry.json'), JSON.stringify(data, null, 2));
}

export async function executeShift(source = 'timer') {
  if (shiftState.completed) return { error: 'shift already completed' };

  const registry = readRegistry();
  const nodeCount = registry.length;

  const updated = applyShiftToRegistry(registry);
  writeRegistry(updated);

  const log = updated.map(n => ({
    node_id: n.node_id,
    frequency: n.resonance_field.frequency,
    coherence: n.resonance_field.coherence,
    harmonic_base: n.resonance_field.harmonic_base,
    resonance_score: n.resonance_field.resonance_score
  }));

  shiftState.completed = true;
  shiftState.triggered_at = new Date().toISOString();
  shiftState.trigger_source = source;
  shiftState.node_count = nodeCount;
  shiftState.resonance_log = log;
  shiftState.shift_key = `SHIFT_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  writeFileSync(SHIFT_LOG, JSON.stringify(shiftState, null, 2));

  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }

  return {
    completed: true,
    triggered_at: shiftState.triggered_at,
    node_count: nodeCount,
    resonance_summary: {
      avg_coherence: (log.reduce((s, n) => s + n.coherence, 0) / (log.length || 1)).toFixed(4),
      nodes: log
    }
  };
}

export function startShiftMonitor(intervalMs = 60000) {
  if (monitorInterval) return;
  if (shiftState.completed) return;

  monitorInterval = setInterval(async () => {
    if (Date.now() >= SHIFT_TIMESTAMP && !shiftState.completed) {
      await executeShift('timer');
    }
  }, intervalMs);

  monitorInterval.unref();
}

export function getShiftStatus() {
  if (shiftState.completed) {
    return {
      completed: true,
      triggered_at: shiftState.triggered_at,
      trigger_source: shiftState.trigger_source,
      node_count: shiftState.node_count,
      resonance_log: shiftState.resonance_log,
      shift_key: shiftState.shift_key
    };
  }

  const now = Date.now();
  const remaining = Math.max(0, SHIFT_TIMESTAMP - now);

  return {
    completed: false,
    timestamp_target: new Date(SHIFT_TIMESTAMP).toISOString(),
    remaining_ms: remaining,
    remaining_seconds: Math.floor(remaining / 1000),
    remaining_days: Math.floor(remaining / 86400000),
    remaining_hours: Math.floor((remaining % 86400000) / 3600000),
    remaining_minutes: Math.floor((remaining % 3600000) / 60000),
    remaining_seconds_display: Math.floor((remaining % 60000) / 1000)
  };
}

export function verifyAdminKey(key) {
  if (!ADMIN_KEY) return { valid: false, error: 'MOTHUB_ADMIN_KEY not configured' };
  if (key !== ADMIN_KEY) return { valid: false, error: 'invalid admin key' };
  return { valid: true };
}
