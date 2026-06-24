const SOLFEGGIO_BASES = [528, 741, 852, 963];

function nearestSolfeggio(freq) {
  let nearest = 528;
  let minDist = Infinity;
  for (const base of SOLFEGGIO_BASES) {
    const dist = Math.abs(freq - base);
    if (dist < minDist) {
      minDist = dist;
      nearest = base;
    }
  }
  const tolerance = nearest * 0.1;
  return minDist <= tolerance ? nearest : freq;
}

export function harmonicResonanceFunction(node) {
  const field = node.resonance_field || {};
  const frequency = field.frequency || 528;
  const coherence = field.coherence || 0.75;
  const intent = field.intent || '';

  const harmonic = nearestSolfeggio(frequency);
  const sigmoidCoherence = 1 / (1 + Math.exp(-5 * (coherence - 0.5)));
  const intentVector = intent.length > 0
    ? [...intent].map(c => c.charCodeAt(0) / 255)
    : [];

  return {
    frequency: harmonic,
    coherence: parseFloat(sigmoidCoherence.toFixed(4)),
    harmonic_base: harmonic,
    intent_vector: intentVector,
    resonance_score: parseFloat((sigmoidCoherence * (harmonic / 963)).toFixed(4))
  };
}

export function debtToZero(adjacencyMatrix, agents) {
  const n = adjacencyMatrix.length;
  const updated = adjacencyMatrix.map(row => [...row]);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const w = updated[i][j];
      if (w < 0) {
        const epsilon = 0.01;
        if (w >= -epsilon) {
          updated[i][j] = updated[j][i] = 0;
        } else {
          updated[i][j] = updated[j][i] = Math.min(0, w + epsilon);
        }
      }
    }
  }
  return updated;
}

export function applyShiftToRegistry(registry) {
  return registry.map(node => {
    const normalized = harmonicResonanceFunction(node);
    return {
      ...node,
      resonance_field: {
        ...node.resonance_field,
        frequency: normalized.frequency,
        coherence: normalized.coherence,
        harmonic_base: normalized.harmonic_base,
        resonance_score: normalized.resonance_score
      },
      shift_applied: true,
      shifted_at: new Date().toISOString()
    };
  });
}
