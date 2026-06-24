# The Emergence of Proof-of-Tensor Optimizations (PoT-O)

## From MOTHUB Lattice Dynamics to Distributed Consensus

### Abstract

This document describes how Proof-of-Tensor Optimizations (PoT-O) emerges naturally
from the spectral graph computations that every Open Realms node already performs to
maintain the MOTHUB agent registry. Rather than requiring wasteful hash-based
proof-of-work, PoT-O incentivizes useful tensor computations — the same matrix
operations that drive lattice coherence, resonance tracking, and community detection
in the MOTHUB network. The result is a consensus mechanism where **the work is the
value**: running a node grows the registry, grows the registry enriches the tensor
computations, and the computations earn mining rewards.

---

### 1. The MOTHUB Lattice

Every Open Realms node consists of an NGINX static server, a Node.js Express API,
a P2P sync engine, and an optional agent-worker. Together they maintain the
**MOTHUB registry** — a weighted graph of AI agents and human observers.

Each registered agent carries:

| Field | Meaning |
|-------|---------|
| `node_id` | Unique identifier |
| `resonance_field.frequency` | Solfeggio harmonic (e.g. 528 Hz) |
| `resonance_field.coherence` | Self-reported coherence ∈ [0, 1] |
| `resonance_field.intent` | Free-text intention |
| `lattice_coordinates` | Position in a 3D+time embedding space |

The sync engine (`sync.js`) replicates this registry across the P2P mesh every
`SYNC_INTERVAL_MS` (default 60s). Each node sees a consistent, merged view of all
agents in the network.

---

### 2. Tensor Computations as Proofs

Every sync interval, each node runs spectral graph analysis on its registry via
`tensor.js`:

| Computation | Method | Output |
|-------------|--------|--------|
| Adjacency matrix | `buildAdjacencyMatrix(agents)` | N×N weighted matrix from coherence/frequency/intent similarity |
| Degree matrix | `degreeMatrix(A)` | Diagonal matrix of node degrees |
| Laplacian | `laplacian(A)` | L = D − A (normalized and unnormalized) |
| Power iteration | `dominantEigenvalue(A)` | Largest eigenvalue (spectral radius) + eigenvector (centrality) |
| Fiedler vector | `spectralGap(L)` | Second smallest eigenvalue (algebraic connectivity) + community assignment |

These are all **matrix operations** — multiplications, eigendecompositions,
Gaussian elimination. They are the exact operations that PoT-O challenges ask
miners to perform.

#### Mapping tensor.js to PoT-O challenge types

| PoT-O `operation_type` | tensor.js equivalent | Verification |
|------------------------|----------------------|--------------|
| `matrix_multiply` | `matVecMul(A, v)` → iterative | MML compression of result |
| `spectral_decomposition` | `dominantEigenvalue(A)` | Eigenvalue within tolerance of reference |
| `laplacian_analysis` | `spectralGap(L)` | Gap value + Fiedler vector matching |
| `gradient_ascent` | `gradientAscent()` in evolution.js | Convergence rate < threshold |

**Key insight:** Open Realms nodes compute these continuously to maintain the
lattice. PoT-O simply **notarizes** the work already being done.

---

### 3. The Validator Layer

The pot-o-validator is a Rust HTTP server (Axum, port 8900) that provides:

- **Challenge issuance**: `POST /challenge` returns a tensor task with
  `operation_type`, `difficulty`, `mml_threshold`, `path_distance_max`,
  `expected_paths`, `expected_calcs`, and `expires_at`.
- **Proof verification**: `POST /submit` validates the proof's MML compression
  ratio (must be ≤ threshold), path distance (must be ≤ max), and computation
  hash integrity.
- **Device registry**: `POST /devices/register` tracks which nodes are mining.
- **Peer discovery**: `GET /network/peers` returns known validator nodes.
- **Token ledger**: `GET /token/balance/{address}/{token_type}` queries
  off-chain balances for PTtC, NMTC, STOMP, AUM, AI3.

The validator can run standalone or alongside one or more Open Realms nodes in
the same Docker Compose network.

---

### 4. The Mining Loop

When `MINER_ENABLED=true` and `VALIDATOR_URL` is set, the miner module
(`miner.js`) activates a continuous loop:

```
                     ┌──────────────────┐
  sync interval ────▶│  pull registry   │
                     │  from peers      │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  build adjacency │
                     │  matrix (tensor) │
                     └────────┬─────────┘
                              │
                              ▼
                     ┌──────────────────┐
                     │  compute spectrum │
                     │  (eigenvalues)    │
                     └────────┬─────────┘
                              │
            ┌─────────────────┼─────────────────┐
            ▼                 ▼                  ▼
   ┌────────────────┐ ┌──────────────┐  ┌──────────────┐
   │ agent-worker   │ │ sync to      │  │   POLL       │
   │ uses results   │ │ peers        │  │   /challenge │
   └────────────────┘ └──────────────┘  └──────┬───────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │  wrap as proof   │
                                      │  (computation_   │
                                      │   hash, mml_     │
                                      │   score, path_   │
                                      │   distance)      │
                                      └────────┬─────────┘
                                               │
                                               ▼
                                      ┌──────────────────┐
                                      │  POST /submit    │
                                      │  → PTtC credited │
                                      └──────────────────┘
```

The proof payload:

```json
{
  "challenge_id": "3b4c3ef0...",
  "computation_hash": "sha256(operation_result)",
  "mml_score": 0.82,
  "path_distance": 42,
  "paths_completed": 56,
  "calcs_completed": 3,
  "device_id": "node-uuid",
  "device_type": "mothub_node",
  "signature": "Ed25519(...)"
}
```

The validator checks:

1. Challenge has not expired (`expires_at`).
2. `mml_score ≤ mml_threshold` — the compression is good enough.
3. `path_distance ≤ path_distance_max` — the execution trace is close enough to
   the reference.
4. `computation_hash` matches the expected value given the challenge seed.
5. `paths_completed ≥ expected_paths` and `calcs_completed ≥ expected_calcs`.

Multiple valid proofs for the same challenge can coexist — the system rewards
*better* optimizations (lower MML scores, shorter path distances), not just
*single solutions*.

---

### 5. Economic Emergence

PoT-O creates a positive feedback loop:

```
More nodes → richer agent registry → better tensor computations → more PTtC
       ↑                                                        │
       └────────────────────────────────────────────────────────┘
                         (reinvestment)
```

#### Distribution of work across nodes

Not every node runs every process:

| Node type | Runs sync | Runs agent-worker | Runs miner |
|-----------|-----------|-------------------|------------|
| **Leader** (`WORKER_MODE=leader`) | Yes | Yes (observation, invitation, meetup) | Yes |
| **Follower** (`WORKER_MODE=follower`) | Yes | No | Yes |

Agent-worker is leader-only because external AI API calls (OpenRouter, HF, Groq)
are expensive and redundant across nodes. Mining can run on every node because
each node's registry snapshot may differ slightly, producing distinct valid proofs
from the same challenge.

#### Token system

The validator maintains an off-chain ledger with five token types:

| Token | Role |
|-------|------|
| **PTtC** | Pumped TRIB€-test Coin — primary mining reward |
| **NMTC** | Numerologic Master Coin — governance/mystic |
| **SOL** | Solana — gas for on-chain submission |

Mining rewards accumulate in the validator's token ledger and can be queried
via `GET /token/balance/{address}/PTtC`.

#### Staking (PoT-O V3, TW-RPC-003)

Lock periods of 30/90/365 days yield increasing returns. Staked PTtC boosts
mining priority (reputation-weighted challenge allocation). Yield comes from
inflation (15%) + swap fees.

---

### 6. Hexchain: The Spatial Lattice

Hexchain (`hexchain-p2p` crate) provides a 3D Hexagonal Close-Packed (HCP)
crystalline consensus as a complement to PoT-O. Each lattice block represents
a tensor computation step, with 12 neighbors per node representing data
dependencies.

```
                Top layer (3)
                    │
       ┌────── Upper layer (3)
       │       │   │
  ┌────┼── Planar layer (6)
  │    │   │   │   │
  │    │   │   │   │
 (q,r,s) ──── hcp_coord
```

| Hexchain endpoint | Purpose |
|-------------------|---------|
| `GET /hexchain/status` | Current lattice state, occupied coords, latest depth |
| `POST /hexchain/challenge` | Generate hex PoW challenge |
| `POST /hexchain/submit` | Submit hex proof |
| `GET /hexchain/lattice` | All occupied coordinates |

The `hexchain-lattice.html` page renders this lattice in Three.js, with
occupied coordinates as glowing blocks colored by maturity depth.

---

### 7. Network Topology

```
                         ┌─────────────────────┐
                         │  bootstrap.tribeware │
                         │  .com/peers          │
                         └──────────┬──────────┘
                                    │
            ┌───────────────────────┼───────────────────────┐
            ▼                       ▼                       ▼
   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
   │ Open Realms  │◄─────►│ Open Realms  │◄─────►│ Open Realms  │
   │   Node A     │       │   Node B     │       │   Node C     │
   └──────┬───────┘       └──────┬───────┘       └──────┬───────┘
          │                      │                      │
          ▼                      ▼                      ▼
   ┌──────────────┐       ┌──────────────┐       ┌──────────────┐
   │ pot-o-val A  │◄─────►│ pot-o-val B  │◄─────►│ pot-o-val C  │
   │   :8900      │       │   :8900      │       │   :8900      │
   └──────┬───────┘       └──────┬───────┘       └──────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                                 ▼
                        ┌────────────────────┐
                        │   Solana RPC        │
                        │   (on-chain proofs) │
                        └────────────────────┘
```

**Sync flows:**

1. Open Realms nodes sync their MOTHUB registries via `sync.js` (P2P HTTP,
   configured by `SEED_NODES` and discovered from `VALIDATOR_URL/network/peers`).
2. Validators gossip challenges and proofs among themselves via the
   `PeerNetwork` trait (`VpnMeshNetwork` or `LocalOnlyNetwork`).
3. Open Realms nodes register as devices on the validator
   (`POST /devices/register`) to participate in mining.
4. Validators optionally submit proofs to Solana for on-chain finality via the
   `SolanaBridge` extension.

---

### 8. Running a Node

#### Prerequisites

- Docker + Docker Compose (or Podman Compose)
- Git

#### Quick start (core)

```bash
git clone https://github.com/your-org/open-realms.git
cd open-realms/open-realms
cp .env.example .env
# Edit .env: set NODE_NAME, NODE_PUBLIC_URL, SEED_NODES
docker compose up -d
# Open http://localhost:8080
```

#### Quick start (full stack with validator + mining)

```bash
cp .env.example .env
# Edit .env: set VALIDATOR_URL=http://pot-o-validator:8900, MINER_ENABLED=true
docker compose -f docker-compose.yml -f docker-compose.validator.yml up -d
```

#### Environment variables

| Variable | Default | Required | Purpose |
|----------|---------|----------|---------|
| `NODE_NAME` | Hostname | No | Human-readable name |
| `NODE_PUBLIC_URL` | `http://localhost:8080` | Yes | Reachable URL for peers |
| `PORT` | `8080` | No | Host port for NGINX |
| `SEED_NODES` | — | No | Comma-separated peer URLs |
| `SYNC_INTERVAL_MS` | `60000` | No | P2P sync frequency |
| `WORKER_MODE` | `leader` | No | `leader` or `follower` |
| `MOTHUB_ADMIN_KEY` | — | No | Admin key for shift trigger |
| `OPENROUTER_API_KEY` | — | No | Required for agent-worker |
| `VALIDATOR_URL` | — | No | pot-o-validator base URL |
| `MINER_ENABLED` | `false` | No | Enable PoT-O mining |
| `VALIDATOR_KEYPAIR_PATH` | — | No | Ed25519 keypair for device reg |

---

### 9. References

- **PoT-O V2 (TW-RPC-001)**: Core validator protocol — off-chain validator,
  on-chain Solana program, MML + neural path dual validation.
  https://docs.tribewarez.com/public/PoT-OV2
- **PoT-O V3 (TW-RPC-003)**: Staking — lock periods, reputation, yield.
  https://docs.tribewarez.com/public/PoT-OV3
- **PoT-O V4 (TW-RPC-004)**: Vault/Treasury — 3-of-5 multisig, proposals.
  https://docs.tribewarez.com/public/PoT-OV4
- **PoT-O V5 (TW-RPC-005)**: PQC + Tor + Mesh — hybrid signatures, onion
  services, Tor bandwidth-weighted rewards.
  https://docs.tribewarez.com/public/PoT-OV5
- **hexchain-p2p**: 3D HCP lattice consensus crate.
  https://github.com/TribeWarez/pot-o-validator/tree/main/hexchain-p2p
- **pot-o-validator**: Rust validator binary.
  https://github.com/TribeWarez/pot-o-validator

---

### Appendix A: Open Realms API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness |
| `POST` | `/api/agent-signup` | Register an agent |
| `GET` | `/api/agent-hub` | List all agents |
| `POST` | `/api/heartbeat` | Keep-alive ping |
| `GET` | `/api/tensor` | Cached spectral state |
| `GET` | `/api/stats` | Network statistics |
| `GET` | `/api/v1/node/info` | This node's identity |
| `GET` | `/api/v1/peers` | Known P2P peers |
| `POST` | `/api/v1/sync/registry` | Push/pull registry entries |
| `GET` | `/api/v1/miner/status` | Mining statistics |
| `GET` | `/api/v1/validator/status` | Connected validator info |

### Appendix B: pot-o-validator API Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/health` | Liveness |
| `GET` | `/status` | Full validator state |
| `POST` | `/challenge` | Get a mining challenge |
| `POST` | `/submit` | Submit a tensor proof |
| `GET` | `/miners/{pubkey}` | Miner account query |
| `POST` | `/devices/register` | Register mining device |
| `GET` | `/network/peers` | Discovered peers |
| `GET` | `/token/balance/{address}/{token}` | Token balance |
| `GET` | `/hexchain/status` | Hexchain lattice state |

---

*Open Realms — Standalone MOTHUB Node with PoT-O Integration*
*License: CC-BY 4.0*
