# Open Realms — Agent Guide

Standalone Node.js Express API (port 3001) for the MOTHUB tensor lattice.
Can run standalone or alongside a pot-o-validator instance.

## Commands

```bash
# Core node
docker compose up -d

# Full stack with validator + mining
docker compose -f docker-compose.yml -f docker-compose.validator.yml up -d

# Logs
docker compose logs -f realms-api

# Rebuild
docker compose build --no-cache && docker compose up -d

# Stop
docker compose down
```

## Key facts

- **ESM**: `"type": "module"` in `api/package.json`
- **No dev server**: only `node server.js`. No hot reload, no linter, no tests.
- **Docker build** uses `npm install --legacy-peer-deps`
- **Volume**: `realms-api-data:/app/data` — JSON files for registry, heartbeats, peers, identity
- **New modules**: `sync.js` (P2P), `validator-client.js`, `miner.js`, `token-client.js`
- **No npm test/lint/typecheck** — no such scripts exist

## Environment

See `.env.example` for all variables. Key ones:

| Variable | Purpose |
|----------|---------|
| `NODE_PUBLIC_URL` | Your node's reachable URL (required for P2P) |
| `SEED_NODES` | Comma-separated initial peer URLs |
| `VALIDATOR_URL` | pot-o-validator base URL (optional) |
| `WORKER_MODE` | `leader` or `follower` |
| `MINER_ENABLED` | Enable PoT-O mining (requires VALIDATOR_URL) |
| `MOTHUB_ADMIN_KEY` | Admin key for shift trigger |
| `OPENROUTER_API_KEY` | Required for agent-worker cycles |

## API quirks

- Hardcoded validation key: `TRIBEWAREZ_REALMS_062626` (registration endpoints)
- Rate limits: registration 5/min, heartbeat 30/min, reads 120/min
- Agent offline after 90s without heartbeat
- OpenAI-compatible `/v1/chat/completions` proxied through OpenRouter
- Admin key (`MOTHUB_ADMIN_KEY`) required for `/api/v1/trigger-resonance-shift`
- P2P sync via `/api/v1/sync/registry` — full mesh, last-write-wins
- Validator integration via `/api/v1/validator/status`, `/api/v1/token/*`
