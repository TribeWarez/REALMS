#!/usr/bin/env python3
"""
Ch7 cluster generator: one shard per worker (Pi/ESP).

Splits total records across --workers; this run produces shard for --worker-id.
Stdlib-only in the hot path; optional --push to HF (Tribewarez/synthetic-pot-o-challenges-ch7-cluster-XXXX).
Optional --add-geometry-id adds geometry_id and weight (superposition-style).

Usage:
  python generate_synthetic_pot_o_challenges_ch7_cluster.py --total 8192 --workers 4 --worker-id 0 [--push] [--add-geometry-id]
"""

import argparse
import json
import random
import sys
from pathlib import Path

# Reuse Ch7 logic from same repo (stdlib-only)
try:
    from generate_synthetic_pot_o_challenges_ch7 import generate_record_ch7
except ImportError:
    # Standalone run (e.g. from another dir): use inline fallback
    def generate_record_ch7() -> dict:
        raise RuntimeError(
            "Run from repo root so generate_synthetic_pot_o_challenges_ch7 is importable, "
            "or add repo root to PYTHONPATH."
        )


DEFAULT_SEED = 42
HF_REPO_PREFIX = "Tribewarez/synthetic-pot-o-challenges-ch7-cluster"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Ch7 cluster generator: produce one shard for this worker.")
    p.add_argument("--total", type=int, default=8192, help="Total records across all workers (1024–8192)")
    p.add_argument("--worker-id", type=int, default=0, help="This worker index (0 .. workers-1)")
    p.add_argument("--workers", type=int, default=1, help="Number of workers")
    p.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Base RNG seed")
    p.add_argument("--output-dir", type=str, default=".", help="Directory for output JSONL")
    p.add_argument("--push", action="store_true", help="Push shard to Hugging Face (requires datasets)")
    p.add_argument("--add-geometry-id", action="store_true", help="Add geometry_id and weight to each record")
    return p.parse_args()


def partition(total: int, workers: int, worker_id: int) -> tuple[int, int]:
    """Record range [start, end) for this worker."""
    if workers <= 0 or worker_id < 0 or worker_id >= workers:
        return 0, 0
    chunk = total // workers
    start = worker_id * chunk
    end = start + chunk if worker_id < workers - 1 else total
    return start, end


def main() -> None:
    args = parse_args()
    total = max(1024, min(8192, args.total))
    workers = max(1, args.workers)
    worker_id = max(0, min(workers - 1, args.worker_id))
    start, end = partition(total, workers, worker_id)
    if start >= end:
        print(f"Worker {worker_id}/{workers} has no records (total={total})", file=sys.stderr)
        sys.exit(1)

    random.seed(args.seed + worker_id)
    n_records = end - start
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"synthetic-pot-o-challenges-ch7-cluster-{worker_id:04d}.jsonl"

    with open(out_file, "w") as f:
        for i in range(n_records):
            record = generate_record_ch7()
            if args.add_geometry_id:
                record["geometry_id"] = f"{worker_id}:{start + i}"
                record["weight"] = round(1.0 / (1 + (start + i) % 10), 4)
            f.write(json.dumps(record) + "\n")

    print(f"Wrote {n_records} records to {out_file}")

    if args.push:
        try:
            from datasets import Dataset, load_dataset
            from huggingface_hub import login
            login()
            repo_id = f"{HF_REPO_PREFIX}-{worker_id:04d}"
            ds = load_dataset("json", data_files=str(out_file), split="train")
            ds = ds.train_test_split(test_size=min(0.1, max(0, 1 - 10 / len(ds))))
            ds.push_to_hub(repo_id, private=False)
            print(f"Pushed to {repo_id}")
        except ImportError as e:
            print(f"Push requires datasets and huggingface_hub: {e}", file=sys.stderr)
            sys.exit(1)


if __name__ == "__main__":
    main()
