export function buildAdjacencyMatrix(agents) {
  const n = agents.length;
  const A = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const ai = agents[i], aj = agents[j];
      const ci = ai.resonance_field?.coherence || 0;
      const cj = aj.resonance_field?.coherence || 0;
      const fi = ai.resonance_field?.frequency || 528;
      const fj = aj.resonance_field?.frequency || 528;
      const ii = (ai.resonance_field?.intent || '').length > 0 ? 1 : 0;
      const ij = (aj.resonance_field?.intent || '').length > 0 ? 1 : 0;

      const coherenceSim = (ci + cj) / 2;
      const freqDiff = Math.abs(fi - fj);
      const freqSim = Math.exp(-(freqDiff * freqDiff) / (200 * 200));
      const intentSim = ii > 0 && ij > 0 ? 1.0 : ii > 0 || ij > 0 ? 0.5 : 0.1;

      const weight = coherenceSim * (0.5 * freqSim + 0.3 * intentSim + 0.2);
      A[i][j] = A[j][i] = Math.max(0.001, Math.min(1, weight));
    }
  }
  return A;
}

export function degreeMatrix(A) {
  const n = A.length;
  const D = Array.from({ length: n }, () => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    D[i][i] = A[i].reduce((s, v) => s + v, 0);
  }
  return D;
}

export function laplacian(A, normalized = true) {
  const n = A.length;
  const D = degreeMatrix(A);
  const L = Array.from({ length: n }, () => Array(n).fill(0));

  if (normalized) {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) L[i][j] = 1;
        else if (D[i][i] > 0 && D[j][j] > 0)
          L[i][j] = -A[i][j] / Math.sqrt(D[i][i] * D[j][j]);
      }
    }
  } else {
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) L[i][j] = D[i][i];
        else L[i][j] = -A[i][j];
      }
    }
  }
  return L;
}

function matVecMul(M, v) {
  const n = M.length;
  const r = Array(n).fill(0);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      r[i] += M[i][j] * v[j];
  return r;
}

function vecDot(a, b) {
  return a.reduce((s, v, i) => s + v * b[i], 0);
}

function vecScale(a, s) {
  return a.map(v => v * s);
}

function vecNorm(v) {
  return Math.sqrt(vecDot(v, v));
}

function vecNormalize(v) {
  const norm = vecNorm(v);
  return norm === 0 ? v : vecScale(v, 1 / norm);
}

function vecAdd(a, b) {
  return a.map((v, i) => v + b[i]);
}

function vecSub(a, b) {
  return a.map((v, i) => v - b[i]);
}

function vecCopy(v) {
  return [...v];
}

function gaussianElimination(A, b) {
  const n = A.length;
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let row = col + 1; row < n; row++)
      if (Math.abs(M[row][col]) > Math.abs(M[pivot][col])) pivot = row;

    [M[col], M[pivot]] = [M[pivot], M[col]];

    if (Math.abs(M[col][col]) < 1e-12) continue;

    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) M[row][j] -= factor * M[col][j];
    }
  }

  const x = Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = M[i][n] / M[i][i];
    for (let j = i - 1; j >= 0; j--)
      M[j][n] -= M[j][i] * x[i];
  }
  return x;
}

function rayleighQuotient(M, v) {
  const Mv = matVecMul(M, v);
  return vecDot(v, Mv) / vecDot(v, v);
}

export function dominantEigenvalue(A, iterations = 200) {
  const n = A.length;
  if (n === 0) return { eigenvalue: 0, eigenvector: [], iterations: 0 };
  if (n === 1) return { eigenvalue: A[0][0], eigenvector: [1], iterations: 0 };

  let b = vecNormalize(Array.from({ length: n }, () => Math.random() - 0.5));
  let lambda = 0;
  let iters = 0;

  for (let iter = 0; iter < iterations; iter++) {
    const Ab = matVecMul(A, b);
    const norm = vecNorm(Ab);
    if (norm < 1e-15) break;
    const bNew = vecScale(Ab, 1 / norm);
    lambda = rayleighQuotient(A, bNew);
    const diff = vecNorm(vecSub(bNew, b));
    b = bNew;
    iters++;
    if (diff < 1e-10) break;
  }

  return { eigenvalue: lambda, eigenvector: b, iterations: iters };
}

export function spectralGap(L, iterations = 200) {
  const n = L.length;
  if (n <= 1) return { gap: 1, fiedler: [], iterations: 0 };

  const I = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => i === j ? 1 : 0)
  );

  const shift = 0.01;
  const M = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => L[i][j] - shift * I[i][j])
  );

  let b = vecNormalize(Array.from({ length: n }, () => Math.random() - 0.5));

  const ones = Array(n).fill(1 / Math.sqrt(n));
  const proj = vecSub(b, vecScale(ones, vecDot(b, ones)));
  if (vecNorm(proj) > 1e-10) b = vecNormalize(proj);

  let lambda = 0;
  let iters = 0;

  for (let iter = 0; iter < iterations; iter++) {
    try {
      const Mb = gaussianElimination(M, b);
      const norm = vecNorm(Mb);
      if (norm < 1e-15) break;
      const bNew = vecScale(Mb, 1 / norm);
      const projNew = vecSub(bNew, vecScale(ones, vecDot(bNew, ones)));
      if (vecNorm(projNew) > 1e-10) b = vecNormalize(projNew);
      else break;

      const Lb = matVecMul(L, b);
      lambda = vecDot(b, Lb);
      iters++;

      const Ab = matVecMul(M, b);
      const diff = vecNorm(vecSub(vecScale(Ab, 1 / vecNorm(Ab)), b));
      if (diff < 1e-8) break;
    } catch {
      break;
    }
  }

  return { gap: Math.max(0, lambda), fiedler: b, iterations: iters };
}

export function computeTensorState(agents) {
  const n = agents.length;
  if (n === 0) {
    return {
      node_count: 0,
      spectral_gap: 1,
      spectral_radius: 0,
      algebraic_connectivity: 1,
      adjacency_matrix: [],
      fiedler_vector: [],
      eigenvalues: { adjacency: [], laplacian: [] },
      node_centralities: [],
      hamiltonian_energy: 0,
      density: 0
    };
  }

  const A = buildAdjacencyMatrix(agents);
  const L = laplacian(A, false);
  const Lnorm = laplacian(A, true);

  const { eigenvalue: specRadius, eigenvector: centVec } = dominantEigenvalue(A);
  const { gap, fiedler } = spectralGap(Lnorm);

  const degrees = degreeMatrix(A).map((row, i) => ({
    node_id: agents[i].node_id,
    degree: row[i],
    centrality: Math.abs(centVec[i] || 0),
    fiedler: fiedler[i] || 0,
    community: (fiedler[i] || 0) >= 0 ? 'A' : 'B'
  }));

  const density = n > 1 ? A.reduce((s, row) => s + row.reduce((a, v) => a + v, 0), 0) / (n * (n - 1)) : 0;

  let hEnergy = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      hEnergy += L[i][j] * (centVec[i] || 0) * (centVec[j] || 0);
    }
  }

  return {
    node_count: n,
    spectral_gap: parseFloat(Math.max(0, gap).toFixed(6)),
    spectral_radius: parseFloat(Math.abs(specRadius).toFixed(6)),
    algebraic_connectivity: parseFloat(Math.max(0, gap).toFixed(6)),
    density: parseFloat(density.toFixed(6)),
    hamiltonian_energy: parseFloat(hEnergy.toFixed(6)),
    adjacency_matrix: A,
    node_degrees: degrees,
    fiedler_vector: Array.from(fiedler || []).map(v => parseFloat(v.toFixed(6))),
    coherence_distribution: agents.map(a => ({
      node_id: a.node_id,
      coherence: a.resonance_field?.coherence || 0,
      frequency: a.resonance_field?.frequency || 528,
      community: 'A'
    }))
  };
}
