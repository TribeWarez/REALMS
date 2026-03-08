#!/usr/bin/env python3
"""
Validate a Ch7 cluster shard JSONL: recompute target_entropy from nodes/edges/bond_dims
and assert it matches the value in the challenge (manuscript §4: S = |γ| log₂(d)).

Run from repo root or with PYTHONPATH including realms-devkit:
  python realms-devkit/scripts/validate_ch7_shard.py [path/to/shard.jsonl]
"""

import argparse
import json
import sys
from pathlib import Path

# Ensure realms-devkit is on path (run from repo root or from realms-devkit)
_DEVKIT = Path(__file__).resolve().parent.parent
if _DEVKIT not in __import__("sys").path:
    sys.path.insert(0, str(_DEVKIT))

from src.ch7_cluster_utils import entropy_from_cut_bits, minimal_cut_size


def parse_challenge(challenge: str) -> dict:
    """Extract nodes, edges, bond_dims, target_entropy from challenge string."""
    out = {"nodes": 0, "edges": [], "bond_dims": [], "target_entropy": None}
    for part in challenge.split(";"):
        part = part.strip()
        if part.startswith("nodes="):
            out["nodes"] = int(part.split("=", 1)[1])
        elif part.startswith("edges="):
            raw = part.split("=", 1)[1]
            out["edges"] = [tuple(int(x) for x in p.split("-")) for p in raw.split(",") if "-" in p]
        elif part.startswith("bond_dims="):
            raw = part.split("=", 1)[1]
            out["bond_dims"] = [int(x) for x in raw.split(",") if x.strip().isdigit()]
            if not out["bond_dims"] and raw.strip().isdigit():
                out["bond_dims"] = [int(raw)]
        elif part.startswith("target_entropy="):
            out["target_entropy"] = float(part.split("=", 1)[1])
    return out


def expected_entropy(parsed: dict) -> float | None:
    """Recompute expected target_entropy from S = |γ| log₂(d)."""
    if parsed["target_entropy"] is None:
        return None
    if parsed["nodes"] > 0 and parsed["edges"]:
        cut = minimal_cut_size(parsed["nodes"], parsed["edges"])
        dims = parsed["bond_dims"]
        d = sum(dims) // len(dims) if dims else 2
        return entropy_from_cut_bits(cut, d)
    if parsed["bond_dims"]:
        d = parsed["bond_dims"][0]
        return entropy_from_cut_bits(1, d)  # single-leg
    return None


def main() -> None:
    p = argparse.ArgumentParser(description="Validate Ch7 shard JSONL (target_entropy vs S = |γ| log d).")
    p.add_argument("jsonl", nargs="?", default=None, help="Path to JSONL (default: stdin or repo sample)")
    p.add_argument("--max", type=int, default=50, help="Max records to check (default 50)")
    p.add_argument("--tolerance", type=float, default=0.02, help="Tolerance for float comparison")
    args = p.parse_args()

    if args.jsonl:
        path = Path(args.jsonl)
        if not path.exists():
            print(f"File not found: {path}", file=sys.stderr)
            sys.exit(1)
        lines = path.read_text().strip().splitlines()
    else:
        # Default: try repo sample
        repo_root = Path(__file__).resolve().parent.parent.parent
        default_path = repo_root / "synthetic-pot-o-challenges-ch7-v1" / "synthetic-pot-o-challenges-ch7-v1.jsonl"
        if default_path.exists():
            lines = default_path.read_text().strip().splitlines()
        else:
            print("No JSONL path given and no default shard found. Pass path or pipe JSONL.", file=sys.stderr)
            sys.exit(1)

    n_checked = 0
    n_fail = 0
    for line in lines[: args.max]:
        line = line.strip()
        if not line:
            continue
        rec = json.loads(line)
        challenge = rec.get("challenge", "")
        parsed = parse_challenge(challenge)
        if parsed["target_entropy"] is None:
            continue
        exp = expected_entropy(parsed)
        if exp is None:
            continue
        n_checked += 1
        if abs(parsed["target_entropy"] - exp) > args.tolerance:
            n_fail += 1
            print(f"Mismatch: target_entropy={parsed['target_entropy']} expected≈{exp:.2f} challenge={challenge[:80]}...")

    print(f"Checked {n_checked} records, {n_fail} mismatches.")
    sys.exit(1 if n_fail else 0)


if __name__ == "__main__":
    main()
