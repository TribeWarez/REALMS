#!/usr/bin/env python3
"""
Synthetic PoT-O (Proof of Tensor Optimizations) challenge generator.

Aligned with TribeWarez (https://github.com/TribeWarez) and PoT-O documentation
(https://docs.tribewarez.com/pot-o/). PoT-O uses MML (Minimum Message Length) path
validation and neural path (activation) validation per how-it-works:
https://docs.tribewarez.com/pot-o/how-it-works

Generates 100 reproducible JSONL records with challenge specs and rule-based
optimal_path strings (MML-style score: lower = better compression).
Uses only stdlib (random, json). Reproducibility: random.seed(42).

For challenges that prove tensor dimensioning and networking effects (Part IV
§3, §4, §7 — Information-Theoretic Foundation of Spacetime), use
generate_synthetic_pot_o_challenges_ch7.py and see CHALLENGE_FORMAT.md.
"""

import json
import math
import random

random.seed(42)

OUTPUT_PATH = "synthetic-pot-o-challenges-v1.jsonl"
NUM_RECORDS = 100

DTYPES = ("float16", "float32", "int8")
SHAPES = [
    [16, 32],
    [32, 64],
    [64, 128],
    [8, 256],
    [32, 32],  # ESP-friendly (PoT-O docs: max 64x64)
    [64, 64],
]
OPS_POOL = [
    "matmul",
    "lowrank",
    "gelu",
    "relu",
    "quant4",
    "quant8",
    "prune0.2",
    "prune0.4",
    "transpose",
]
TARGET_MML_MIN = 0.15
TARGET_MML_MAX = 0.55


def sample_target_mml() -> float:
    return round(random.uniform(TARGET_MML_MIN, TARGET_MML_MAX), 2)


def build_challenge(shape: list[int], dtype: str, target_mml: float, ops: list[str]) -> str:
    rows, cols = shape[0], shape[1]
    ops_str = ",".join(ops)
    return f"tensor:shape=[{rows},{cols}];dtype={dtype};target_mml={target_mml};ops:{ops_str}"


def build_optimal_path(
    shape: list[int],
    target_mml: float,
) -> str:
    rows, cols = shape[0], shape[1]
    product = rows * cols
    aggressive = target_mml < 0.3
    use_lowrank = product > 2000

    # Score in path: slightly better than target (MML lower = better)
    score_val = max(TARGET_MML_MIN, round(target_mml - random.uniform(0.01, 0.05), 2))
    if aggressive:
        score_val = max(TARGET_MML_MIN, round(target_mml - 0.02, 2))

    parts = []

    # Start: matmul, optionally with lowrank
    if use_lowrank:
        rank = random.choice([16, 32])
        parts.append(f"matmul[lowrank:{rank}]")
    else:
        parts.append("matmul")

    # Activation
    parts.append(random.choice(["relu", "gelu"]))

    # Quant: aggressive -> 4bit, else 4 or 8
    if aggressive:
        parts.append("quant:4bit")
    else:
        parts.append(random.choice(["quant:4bit", "quant:8bit"]))

    # Prune: aggressive -> 0.4, else 0.2 or 0.3 or 0.4
    if aggressive:
        parts.append("prune:0.4")
    else:
        p = random.choice([0.2, 0.3, 0.4])
        parts.append(f"prune:{p}")

    parts.append(f"score:{score_val}")
    return " -> ".join(parts)


def difficulty_from_target_mml(target_mml: float) -> float:
    return round(1 + math.log2(1.0 / target_mml), 4)


def generate_record() -> dict:
    shape = random.choice(SHAPES)
    dtype = random.choice(DTYPES)
    target_mml = sample_target_mml()
    n_ops = random.randint(4, 6)
    ops = random.sample(OPS_POOL, n_ops)

    challenge = build_challenge(shape, dtype, target_mml, ops)
    optimal_path = build_optimal_path(shape, target_mml)

    record = {
        "challenge": challenge,
        "optimal_path": optimal_path,
        "difficulty": difficulty_from_target_mml(target_mml),
        "source": "PoT-O/TribeWarez",
    }
    return record


def main() -> None:
    with open(OUTPUT_PATH, "w") as f:
        for _ in range(NUM_RECORDS):
            record = generate_record()
            f.write(json.dumps(record) + "\n")
    print(f"Wrote {NUM_RECORDS} records to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
