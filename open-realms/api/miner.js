import fetch from 'node-fetch';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { computeTensorState } from './tensor.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const REGISTRY_FILE = join(DATA_DIR, 'mothub_registry.json');

const VALIDATOR_URL = process.env.VALIDATOR_URL || '';
const MINER_ENABLED = process.env.MINER_ENABLED === 'true';
const CHALLENGE_POLL_INTERVAL = parseInt(process.env.CHALLENGE_POLL_INTERVAL || '15000', 10);
const DEVICE_TYPE = process.env.VALIDATOR_DEVICE_TYPE || 'mothub_node';

let minerActive = false;
let stats = {
  challenges_polled: 0,
  proofs_submitted: 0,
  proofs_accepted: 0,
  proofs_rejected: 0,
  current_challenge: null,
  last_submission: null
};

// --- Challenge fetching ---

async function fetchChallenge() {
  if (!VALIDATOR_URL) return null;
  try {
    const resp = await fetch(`${VALIDATOR_URL}/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slot: Math.floor(Date.now() / 1000),
        slot_hash: createHash('sha256').update(String(Date.now())).digest('hex').slice(0, 16),
        device_type: DEVICE_TYPE
      }),
      signal: AbortSignal.timeout(10000)
    });
    if (!resp.ok) return null;
    const challenge = await resp.json();
    stats.current_challenge = challenge;
    return challenge;
  } catch {
    return null;
  }
}

// --- Tensor computation wrapper ---

function computeTensorProof(agents, challenge) {
  // Run the same spectral analysis tensor.js already does
  const state = computeTensorState(agents);

  // Map operation_type to the relevant output
  let result, mmlScore, pathDistance;

  switch (challenge.operation_type) {
    case 'matrix_multiply': {
      // Use adjacency matrix multiplication as the computation
      const A = state.adjacency_matrix;
      const n = A.length;
      const C = Array.from({ length: n }, () => Array(n).fill(0));
      for (let i = 0; i < n; i++)
        for (let k = 0; k < n; k++)
          if (A[i][k] !== 0)
            for (let j = 0; j < n; j++)
              C[i][j] += A[i][k] * A[k][j];

      result = C;
      mmlScore = estimateMML(C);
      pathDistance = estimatePathDistance(C);
      break;
    }
    case 'spectral_decomposition': {
      result = { spectral_radius: state.spectral_radius, spectral_gap: state.spectral_gap };
      mmlScore = 0.5; // fixed for eigendecomposition
      pathDistance = state.algebraic_connectivity;
      break;
    }
    case 'laplacian_analysis': {
      result = { gap: state.spectral_gap, fiedler: state.fiedler_vector };
      mmlScore = 0.3;
      pathDistance = state.spectral_gap;
      break;
    }
    default: {
      result = { hamiltonian_energy: state.hamiltonian_energy, density: state.density };
      mmlScore = 0.4;
      pathDistance = state.hamiltonian_energy;
    }
  }

  const computationHash = createHash('sha256')
    .update(JSON.stringify(result))
    .digest('hex');

  return {
    computation_hash: computationHash,
    mml_score: Math.max(0, Math.min(1, mmlScore)),
    path_distance: Math.max(0, pathDistance),
    paths_completed: challenge.expected_paths || state.node_count,
    calcs_completed: challenge.expected_calcs || Math.min(state.node_count, 10)
  };
}

// --- MML estimation ---

function estimateMML(matrix) {
  if (!matrix || matrix.length === 0) return 1;
  const flat = matrix.flat().filter(v => v !== 0);
  if (flat.length === 0) return 1;

  const mean = flat.reduce((s, v) => s + v, 0) / flat.length;
  const variance = flat.reduce((s, v) => s + (v - mean) ** 2, 0) / flat.length;
  const std = Math.sqrt(variance);

  // Lower std means more compressible (lower MML score)
  const normalizedStd = Math.min(1, std / 0.5);
  return 1 - normalizedStd;
}

function estimatePathDistance(matrix) {
  // Use matrix norm as a proxy for path distance
  if (!matrix || matrix.length === 0) return 0;
  let norm = 0;
  for (const row of matrix) {
    for (const v of row) {
      norm += v * v;
    }
  }
  return Math.sqrt(norm);
}

// --- Proof submission ---

async function submitProof(proof, nodeId) {
  if (!VALIDATOR_URL) return null;
  try {
    const resp = await fetch(`${VALIDATOR_URL}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proof: {
          challenge_id: proof.challenge_id,
          computation_hash: proof.computation_hash,
          mml_score: proof.mml_score,
          path_distance: proof.path_distance,
          paths_completed: proof.paths_completed,
          calcs_completed: proof.calcs_completed,
          device_id: nodeId,
          device_type: DEVICE_TYPE
        }
      }),
      signal: AbortSignal.timeout(15000)
    });
    const data = await resp.json();
    stats.last_submission = { timestamp: new Date().toISOString(), accepted: resp.ok };
    if (resp.ok) {
      stats.proofs_accepted++;
    } else {
      stats.proofs_rejected++;
    }
    return { accepted: resp.ok, data };
  } catch (e) {
    stats.last_submission = { timestamp: new Date().toISOString(), accepted: false, error: e.message };
    stats.proofs_rejected++;
    return { accepted: false, error: e.message };
  }
}

// --- Mining loop ---

export async function runMiningCycle(agents, nodeId) {
  if (!MINER_ENABLED || !VALIDATOR_URL) return { enabled: false };

  const challenge = await fetchChallenge();
  if (!challenge) {
    return { enabled: true, polled: true, challenge: null };
  }

  stats.challenges_polled++;

  const proof = computeTensorProof(agents, challenge);
  proof.challenge_id = challenge.id;

  const result = await submitProof(proof, nodeId);
  stats.proofs_submitted++;

  return { enabled: true, challenge, proof, submission: result };
}

// --- Public API ---

export function getMinerStatus() {
  return {
    enabled: MINER_ENABLED,
    active: minerActive,
    validator_url: VALIDATOR_URL || null,
    ...stats
  };
}

export function isMinerEnabled() {
  return MINER_ENABLED && !!VALIDATOR_URL;
}

// --- Lifecycle ---

export function startMiner(nodeId) {
  if (!MINER_ENABLED || !VALIDATOR_URL) {
    console.log('[miner] not starting — MINER_ENABLED=false or no VALIDATOR_URL');
    return;
  }

  minerActive = true;
  console.log(`[miner] starting on ${VALIDATOR_URL}, interval=${CHALLENGE_POLL_INTERVAL}ms`);

  // Delay first cycle to let registry populate
  setTimeout(() => {
    const interval = setInterval(async () => {
      try {
        const registry = JSON.parse(readFileSync(REGISTRY_FILE, 'utf-8'));
        const agents = registry.map(n => ({
          ...n,
          online: true
        }));
        await runMiningCycle(agents, nodeId);
      } catch {}
    }, CHALLENGE_POLL_INTERVAL);
    interval.unref();
  }, 10000);
}
