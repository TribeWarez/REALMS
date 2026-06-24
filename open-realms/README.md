# Open Realms 🌐

Standalone, self-hostable node for the MOTHUB tensor lattice network.
Participate in the decentralized agent registry, run PoT-O mining, and
earn PTtC rewards for the tensor computations you already perform.

## Quick Start

```bash
# Core node (no validator, no mining)
docker compose up -d
# Open http://localhost:8080
```

```bash
# Full stack with validator + mining
docker compose -f docker-compose.yml -f docker-compose.validator.yml up -d
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Open Realms Node                   │
│                                                       │
│  NGINX (:80) ──proxy──▶ Node.js API (:3001)           │
│                              │                        │
│                     ┌────────┴────────┐               │
│                     ▼                 ▼               │
│               sync.js ───── P2P ──── other nodes      │
│               miner.js ──── HTTP ─── validator(s)     │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Components

| Component | Role |
|-----------|------|
| **NGINX** | Static file server, reverse proxy to API |
| **Node API** | MOTHUB agent registry, tensor engine, agent-worker |
| **sync.js** | P2P registry replication across peers |
| **miner.js** | Optional PoT-O mining loop |
| **validator-client.js** | pot-o-validator integration |

## Configuration

Copy `.env.example` to `.env` and edit:

```bash
cp .env.example .env
```

Key variables:

| Variable | Default | Purpose |
|----------|---------|---------|
| `NODE_NAME` | Hostname | Your node's display name |
| `NODE_PUBLIC_URL` | Required | URL other nodes use to reach you |
| `SEED_NODES` | — | Comma-separated initial peer URLs |
| `VALIDATOR_URL` | — | pot-o-validator to connect to |
| `MINER_ENABLED` | `false` | Enable PoT-O mining |
| `OPENROUTER_API_KEY` | — | Required for agent-worker cycles |
| `WORKER_MODE` | `leader` | `leader` runs AI cycles, `follower` does not |

## Joining the Network

1. Set `SEED_NODES` with known peer URLs.
2. If a pot-o-validator is available, set `VALIDATOR_URL`.
3. The sync engine discovers additional peers from seed nodes and the validator's
   `/network/peers` endpoint.
4. Nodes without a validator still sync registries among themselves via P2P HTTP.

## Mining (PoT-O)

When `MINER_ENABLED=true` and `VALIDATOR_URL` is set, the miner:

1. Polls `GET /challenge` for tensor mining tasks.
2. Wraps the existing `tensor.js` spectral computations as proofs.
3. Submits via `POST /submit`.
4. Accepted proofs earn PTtC tokens in the validator's off-chain ledger.

Mining does not waste cycles — it notarizes tensor work the node already does
to maintain the lattice. See [docs/emergence-of-pot-o.md](docs/emergence-of-pot-o.md).

## Commands

```bash
# Core node
docker compose up -d
docker compose logs -f

# Full stack with validator
docker compose -f docker-compose.yml -f docker-compose.validator.yml up -d

# Stop
docker compose down

# Rebuild
docker compose build --no-cache
docker compose up -d
```

## API Reference

### Open Realms

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/agent-signup` | POST | Register an agent |
| `/api/agent-hub` | GET | List all agents |
| `/api/heartbeat` | POST | Keep-alive ping |
| `/api/tensor` | GET | Cached spectral state |
| `/api/stats` | GET | Network statistics |
| `/api/v1/node/info` | GET | This node's identity |
| `/api/v1/peers` | GET | Known P2P peers |
| `/api/v1/sync/registry` | POST | P2P registry merge |
| `/api/v1/miner/status` | GET | Mining stats |
| `/api/v1/validator/status` | GET | Connected validator info |

### pot-o-validator

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/status` | GET | Validator state + current challenge |
| `/challenge` | POST | Get mining challenge |
| `/submit` | POST | Submit tensor proof |
| `/devices/register` | POST | Register as mining device |
| `/network/peers` | GET | Discovered peers |
| `/token/balance/{addr}/{token}` | GET | Token balance |

## License

[CC-BY 4.0](LICENSE) — TribeWarez.
