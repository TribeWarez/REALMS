# Ch7 cluster generation

Clustered generation of PoT-O Chapter 7 challenges (tensor dimensioning and networking effects) for [synthetic-pot-o-challenges-ch7-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-ch7-v1) and shard repos `Tribewarez/synthetic-pot-o-challenges-ch7-cluster-XXXX`.

**Reference implementation:** [realms-devkit](realms-devkit/) is the manuscript reference for Part IV (tensor networks, S = |γ| log d, information Lagrangian). The cluster generator uses the same formulas in **stdlib form** (no quimb/numpy) so it runs on Raspberry Pi and ESP32.

## Quick start (Raspberry Pi)

```bash
# Worker 0 of 4, 8192 total records, write JSONL then push to HF
python generate_synthetic_pot_o_challenges_ch7_cluster.py --total 8192 --workers 4 --worker-id 0 --push

# Worker 1 (run on another Pi or same machine)
python generate_synthetic_pot_o_challenges_ch7_cluster.py --total 8192 --workers 4 --worker-id 1 --push
```

Output: `synthetic-pot-o-challenges-ch7-cluster-0000.jsonl` (and pushed to `Tribewarez/synthetic-pot-o-challenges-ch7-cluster-0000`), etc.

## Options

| Option | Description |
|--------|-------------|
| `--total` | Total records across all workers (1024–8192). Default 8192. |
| `--worker-id` | This worker index (0 .. workers-1). |
| `--workers` | Number of workers. |
| `--seed` | Base RNG seed (default 42). Each worker uses `seed + worker_id`. |
| `--output-dir` | Directory for output JSONL. Default current directory. |
| `--push` | Push shard to Hugging Face (requires `datasets`, `huggingface_hub`). |
| `--add-geometry-id` | Add `geometry_id` and `weight` to each record (superposition-style). |

## ESP32 workflow

ESP workers do not push to HF directly. On each ESP:

1. Run the generator (or a MicroPython/C port with the same partition rule and formulas) with `--worker-id N --workers M`, no `--push`.
2. Write the JSONL to SD card or stream via UART/HTTP to a collector.

Then on a Pi or server: collect shards and push each to `Tribewarez/synthetic-pot-o-challenges-ch7-cluster-XXXX` (e.g. with `hf upload` or the same script with `--push` and the collected file).

## Links

- **Model:** [pot-o-pathfinder-tiny-v1](https://huggingface.co/Tribewarez/pot-o-pathfinder-tiny-v1) — path prediction on PoT-O challenges (ESP32, mobile, edge).
- **Dataset (starter):** [synthetic-pot-o-challenges-ch7-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-ch7-v1).
- **Part IV reference:** [realms-devkit](realms-devkit/) — tensor networks, entropy bounds, information Lagrangian (notebooks + Docker).
