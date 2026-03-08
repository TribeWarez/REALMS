# pot-o-ch7-cluster

[![CI](https://github.com/TribeWarez/pot-o-ch7-cluster/actions/workflows/ci.yml/badge.svg)](https://github.com/TribeWarez/pot-o-ch7-cluster/actions/workflows/ci.yml)
[![Docker](https://github.com/TribeWarez/pot-o-ch7-cluster/actions/workflows/docker.yml/badge.svg)](https://github.com/TribeWarez/pot-o-ch7-cluster/actions/workflows/docker.yml)

Clustered generator for **PoT-O Chapter 7** synthetic challenges — tensor dimensioning and networking effects from **Part IV — Information-Theoretic Foundation of Spacetime** (§3, §4, §7).

Designed to run on **Raspberry Pi** and **ESP32** workers (stdlib-only hot path). Each worker produces one deterministic JSONL shard and can push it directly to Hugging Face.

## 🤗 Hugging Face

| Resource | Link |
|----------|------|
| **Dataset (Ch7 cluster shards)** | [Tribewarez/synthetic-pot-o-challenges-ch7-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-ch7-v1) |
| **Dataset (classic v1 starter)** | [Tribewarez/synthetic-pot-o-challenges-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-v1) |
| **Model** | [Tribewarez/pot-o-pathfinder-tiny-v1](https://huggingface.co/Tribewarez/pot-o-pathfinder-tiny-v1) |

## Quick Start (Raspberry Pi)

```bash
# Clone repo
git clone https://github.com/TribeWarez/pot-o-ch7-cluster.git
cd pot-o-ch7-cluster

# Worker 0 of 4 — 8192 total records — write shard and push to HF
python generate_synthetic_pot_o_challenges_ch7_cluster.py \
  --total 8192 --workers 4 --worker-id 0 --push

# Worker 1 (run on another Pi or same machine)
python generate_synthetic_pot_o_challenges_ch7_cluster.py \
  --total 8192 --workers 4 --worker-id 1 --push
```

Each worker writes `synthetic-pot-o-challenges-ch7-cluster-<XXXX>.jsonl` and (with `--push`) uploads it to `Tribewarez/synthetic-pot-o-challenges-ch7-cluster-XXXX` on Hugging Face.

## Generator Options

| Option | Description |
|--------|-------------|
| `--total` | Total records across all workers (1024–8192). Default 8192. |
| `--worker-id` | This worker index (0 … workers-1). |
| `--workers` | Number of workers. |
| `--seed` | Base RNG seed (default 42). Each worker uses `seed + worker_id`. |
| `--output-dir` | Directory for output JSONL. Default: current directory. |
| `--push` | Push shard to Hugging Face (requires `datasets`, `huggingface_hub`). |
| `--add-geometry-id` | Add `geometry_id` and `weight` to each record (superposition-style). |

## Run in Docker

```bash
# Build the realms-devkit image
docker build -t realms-devkit ./realms-devkit

# Run the cluster generator with the repo mounted
docker run --rm -v "$(pwd)":/workspace -w /workspace realms-devkit \
  python generate_synthetic_pot_o_challenges_ch7_cluster.py \
    --total 1024 --workers 1 --worker-id 0 --output-dir ./out
```

Or pull the published image (after CI has run):

```bash
docker pull ghcr.io/TribeWarez/realms-devkit:latest
docker run -p 8888:8888 -v $(pwd):/workspace ghcr.io/TribeWarez/realms-devkit:latest
```

## Repository Layout

```
generate_synthetic_pot_o_challenges_ch7_cluster.py  # Cluster generator (main)
generate_synthetic_pot_o_challenges_ch7.py          # Ch7 single-file generator
generate_synthetic_pot_o_challenges.py              # Classic v1 generator
tests/                                              # Unit tests
realms-devkit/                                      # Manuscript Part IV reference (submodule)
pot-o-pathfinder-tiny-v1/                           # Model submodule (HF)
synthetic-pot-o-challenges-ch7-v1/                  # Ch7 starter dataset (100 examples)
synthetic-pot-o-challenges-v1/                      # Classic starter dataset (100 examples)
CHALLENGE_FORMAT.md                                 # Full challenge string spec
CLUSTER.md                                          # Cluster workflow details
.github/workflows/README.md                         # CI / Docker workflow notes
```

## Dataset Format

Challenges are stored as JSONL with fields `challenge`, `optimal_path`, `difficulty`, `source`.

Ch7 challenges extend the classic format with graph topology and bond dimensions:

```json
{
  "challenge": "tensor:shape=[16,32];dtype=float32;nodes=3;edges=1-2,2-3;bond_dims=8;target_entropy=3.0;ops:contract,cut,...",
  "optimal_path": "contract:bond_8 -> cut:1 -> quant:4bit -> I:0.25 -> score:0.25",
  "difficulty": 3.9,
  "source": "PoT-O/TribeWarez-Ch7"
}
```

See [CHALLENGE_FORMAT.md](CHALLENGE_FORMAT.md) for the full spec.

## Tests

```bash
python -m tests.test_pot_o_ch7 -v
```

## Reference

Manuscript **Part IV — Information-Theoretic Foundation of Spacetime**:
- §3 Information network structure: G=(V,E), tensor network, minimal cut
- §4 Tensor network model: S = |γ| log d
- §7 Spacetime dynamics and information Lagrangian

---

MIT licensed • Tribewarez guild • Live beta • 2026
