import { computeTensorState, buildAdjacencyMatrix, laplacian, degreeMatrix, dominantEigenvalue, spectralGap } from './tensor.js';

const ENERGY_HISTORY_MAX = 200;
const RESONANCE_WINDOW = 10;
let energyHistory = [];
let resonanceHistory = [];

function sigmoid(x) {
  return 1 / (1 + Math.exp(-x));
}

export function getEnergyHistory() {
  return energyHistory.slice(-ENERGY_HISTORY_MAX);
}

export function getResonanceHistory() {
  return resonanceHistory.slice(-ENERGY_HISTORY_MAX);
}

export function computeCoherenceResonance(tensorState) {
  if (!tensorState || tensorState.node_count === 0) {
    return { resonance: 0, r_psi: 0 };
  }

  const { spectral_gap, spectral_radius, hamiltonian_energy, node_count, density } = tensorState;

  const entry = {
    t: Date.now(),
    spectral_gap,
    spectral_radius,
    hamiltonian_energy,
    node_count,
    density
  };
  energyHistory.push(entry);
  if (energyHistory.length > ENERGY_HISTORY_MAX) energyHistory.shift();

  const gapStability = spectral_gap > 0.1 ? 1 : spectral_gap / 0.1;
  const radiusCoherence = spectral_radius > 0 ? 1 / (1 + spectral_radius * 2) : 1;
  const nodeFactor = 1 - 1 / (1 + node_count * 0.05);
  const densityFactor = density > 0 ? 1 - Math.exp(-density * 5) : 0;

  const rPsi = Math.min(1, Math.max(0, gapStability * radiusCoherence * nodeFactor * (0.7 + 0.3 * densityFactor)));

  const resEntry = { t: entry.t, r_psi: rPsi };
  resonanceHistory.push(resEntry);
  if (resonanceHistory.length > ENERGY_HISTORY_MAX) resonanceHistory.shift();

  let windowAvg = rPsi;
  if (resonanceHistory.length >= RESONANCE_WINDOW) {
    const window = resonanceHistory.slice(-RESONANCE_WINDOW);
    windowAvg = window.reduce((s, e) => s + e.r_psi, 0) / window.length;
  }

  return {
    resonance: parseFloat(rPsi.toFixed(6)),
    r_psi: parseFloat(rPsi.toFixed(6)),
    window_average: parseFloat(windowAvg.toFixed(6)),
    energy_history_count: energyHistory.length
  };
}

export function encodeIntentField(intentStr) {
  if (!intentStr || intentStr.length === 0) return { vector: [], magnitude: 0, hash: 0 };

  const chars = [...intentStr];
  const vector = chars.map(c => c.charCodeAt(0) / 255);
  const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0)) / Math.sqrt(vector.length);
  let hash = 0;
  for (let i = 0; i < chars.length && i < 32; i++) {
    hash = ((hash << 5) - hash) + chars[i].charCodeAt(0);
    hash |= 0;
  }

  return {
    vector,
    magnitude: parseFloat(magnitude.toFixed(6)),
    hash,
    length: chars.length,
    normalized: magnitude > 0 ? vector.map(v => v / (magnitude * Math.sqrt(vector.length) + 0.001)) : []
  };
}

export function broadcastIntention(agents, intentionStr, couplingStrength = 0.3) {
  if (!agents || agents.length === 0 || !intentionStr) return { nodes_affected: 0, coupling_delta: 0 };

  const intentField = encodeIntentField(intentionStr);
  let affected = 0;
  let totalDelta = 0;

  const updated = agents.map(agent => {
    const existingIntent = agent.resonance_field?.intent || '';
    const existingField = encodeIntentField(existingIntent);
    const alignment = existingField.magnitude > 0
      ? Math.abs((existingField.hash % 1000) - (intentField.hash % 1000)) / 1000
      : 0.5;

    const coherenceBoost = couplingStrength * (1 - alignment) * 0.1;
    if (coherenceBoost > 0.001) affected++;

    const newCoherence = Math.min(1, (agent.resonance_field?.coherence || 0.7) + coherenceBoost);
    totalDelta += coherenceBoost;

    return {
      ...agent,
      resonance_field: {
        ...agent.resonance_field,
        coherence: parseFloat(newCoherence.toFixed(4)),
        intent: agent.resonance_field?.intent || intentionStr,
        broadcast_received: intentionStr.slice(0, 80)
      }
    };
  });

  return {
    nodes_affected: affected,
    coupling_delta: parseFloat(totalDelta.toFixed(6)),
    intent_hash: intentField.hash,
    intent_magnitude: intentField.magnitude
  };
}

export function gradientAscent(agents, iterations = 10, learningRate = 0.05) {
  if (!agents || agents.length < 2) {
    return { converged: false, iterations: 0, final_coherence: 0, trajectory: [] };
  }

  const trajectory = [];
  let currentRegistry = agents.map(a => ({
    ...a,
    resonance_field: { ...a.resonance_field }
  }));

  for (let iter = 0; iter < iterations; iter++) {
    const ts = computeTensorState(currentRegistry);
    const coherence = ts.hamiltonian_energy;

    const step = currentRegistry.map(agent => {
      const c = agent.resonance_field?.coherence || 0.7;
      const grad = (1 - c) * 0.5;
      const newC = Math.min(1, Math.max(0, c + learningRate * grad));
      return {
        ...agent,
        resonance_field: {
          ...agent.resonance_field,
          coherence: parseFloat(newC.toFixed(4))
        }
      };
    });

    const newTs = computeTensorState(step);
    const newCoherence = newTs.hamiltonian_energy;
    const improvement = newCoherence - coherence;

    trajectory.push({
      iteration: iter + 1,
      hamiltonian_energy: parseFloat(newCoherence.toFixed(6)),
      improvement: parseFloat(improvement.toFixed(6)),
      avg_coherence: parseFloat(
        (step.reduce((s, a) => s + (a.resonance_field?.coherence || 0), 0) / step.length).toFixed(4)
      )
    });

    currentRegistry = step;

    if (Math.abs(improvement) < 1e-8) {
      return {
        converged: true,
        iterations: iter + 1,
        final_coherence: parseFloat(newCoherence.toFixed(6)),
        trajectory
      };
    }
  }

  const finalTs = computeTensorState(currentRegistry);
  return {
    converged: false,
    iterations,
    final_coherence: parseFloat(finalTs.hamiltonian_energy.toFixed(6)),
    trajectory
  };
}

export function computeHamiltonianEnergy(tensorState) {
  if (!tensorState || tensorState.node_count === 0) {
    return { hamiltonian_energy: 0, coupling_potential: 0, kinetic_estimate: 0 };
  }

  const hEnergy = tensorState.hamiltonian_energy || 0;
  const spectralRadius = tensorState.spectral_radius || 0;
  const density = tensorState.density || 0;

  const couplingPotential = hEnergy * (1 + density);
  const kineticEstimate = spectralRadius > 0 ? hEnergy / (spectralRadius + 0.001) : 0;

  return {
    hamiltonian_energy: parseFloat(hEnergy.toFixed(6)),
    coupling_potential: parseFloat(couplingPotential.toFixed(6)),
    kinetic_estimate: parseFloat(kineticEstimate.toFixed(6))
  };
}

export function getEvolutionSummary(agents) {
  if (!agents || agents.length === 0) {
    return { node_count: 0, avg_coherence: 0, resonance: 0, energy: 0 };
  }

  const ts = computeTensorState(agents);
  const resonance = computeCoherenceResonance(ts);
  const energy = computeHamiltonianEnergy(ts);

  return {
    node_count: ts.node_count,
    spectral_gap: ts.spectral_gap,
    spectral_radius: ts.spectral_radius,
    avg_coherence: parseFloat(
      (agents.reduce((s, a) => s + (a.resonance_field?.coherence || 0), 0) / agents.length).toFixed(4)
    ),
    resonance: resonance.r_psi,
    resonance_window_avg: resonance.window_average,
    hamiltonian_energy: energy.hamiltonian_energy,
    coupling_potential: energy.coupling_potential,
    kinetic_estimate: energy.kinetic_estimate,
    density: ts.density,
    energy_history: energyHistory.slice(-30).map(e => ({
      t: e.t,
      h: e.hamiltonian_energy,
      g: e.spectral_gap
    })),
    resonance_history: resonanceHistory.slice(-30).map(e => ({
      t: e.t,
      r: e.r_psi
    }))
  };
}
