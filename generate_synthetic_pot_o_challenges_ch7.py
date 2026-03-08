#!/usr/bin/env python3
"""
Synthetic PoT-O Chapter 7 challenge generator.

Produces challenges that prove (validate) tensor dimensioning and networking
effects from the manuscript Part IV — Information-Theoretic Foundation of
Spacetime (§3, §4, §7):
- §3: Information network structure G=(V,E), minimal cut structure.
- §4: Bond dimension d, entropy S = |γ| log d.
- §7: Information Lagrangian, mutual information I(i:j).

Output: JSONL with challenge, optimal_path, difficulty, source. Same schema
as synthetic-pot-o-challenges-v1; challenge strings include optional
nodes, edges, bond_dims, target_entropy (and optionally weights).
See CHALLENGE_FORMAT.md for the spec.
"""

import json
import math
import random

random.seed(42)

OUTPUT_PATH = "synthetic-pot-o-challenges-ch7-v1/synthetic-pot-o-challenges-ch7-v1.jsonl"
NUM_RECORDS = 100

DTYPES = ("float16", "float32", "int8")
BOND_DIMS = (2, 4, 8, 16)  # per-edge bond dimension d for S = |γ| log d
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
    "contract",
    "cut",
]


def _graph_chain(n: int) -> list[tuple[int, int]]:
    """Edges for chain 1-2, 2-3, ..., (n-1)-n."""
    return [(i, i + 1) for i in range(1, n)]


def _graph_star(n: int) -> list[tuple[int, int]]:
    """Star: center 1, leaves 2..n."""
    return [(1, i) for i in range(2, n + 1)]


def _graph_mesh_3() -> list[tuple[int, int]]:
    """Triangle: 1-2, 2-3, 1-3."""
    return [(1, 2), (2, 3), (1, 3)]


def _graph_mesh_4() -> list[tuple[int, int]]:
    """Square: 1-2, 2-3, 3-4, 4-1, optional 1-3."""
    edges = [(1, 2), (2, 3), (3, 4), (4, 1)]
    if random.random() < 0.5:
        edges.append((1, 3))
    return edges


def sample_graph() -> tuple[int, list[tuple[int, int]]]:
    """Returns (num_nodes, list of (a, b) edges with 1-based indices)."""
    topology = random.choice(["chain", "star", "mesh3", "mesh4"])
    if topology == "chain":
        n = random.randint(2, 4)
        edges = _graph_chain(n)
    elif topology == "star":
        n = random.randint(3, 4)
        edges = _graph_star(n)
    elif topology == "mesh3":
        n = 3
        edges = _graph_mesh_3()
    else:
        n = 4
        edges = _graph_mesh_4()
    return n, edges


def _minimal_cut_size_local(n: int, edges: list[tuple[int, int]]) -> int:
    """Minimum number of edges that separate the graph (bipartition). For small graphs we try partitions."""
    if n <= 1 or not edges:
        return 0
    best = len(edges)
    for bits in range(1, (1 << n)):
        A = {i + 1 for i in range(n) if (bits >> i) & 1}
        if not A or A == set(range(1, n + 1)):
            continue
        cut = sum(1 for (a, b) in edges if (a in A) != (b in A))
        best = min(best, cut)
    return best


def _entropy_from_cut_local(num_edges_cut: int, bond_dim: int) -> float:
    """S = |γ| log₂(d) in bits (manuscript §4)."""
    if num_edges_cut <= 0 or bond_dim <= 0:
        return 0.0
    return num_edges_cut * math.log2(bond_dim)


try:
    from realms_devkit.src.ch7_cluster_utils import (
        entropy_from_cut_bits,
        minimal_cut_size as _minimal_cut_size_devkit,
    )
    entropy_from_cut = entropy_from_cut_bits
    minimal_cut_size = _minimal_cut_size_devkit
except ImportError:
    entropy_from_cut = _entropy_from_cut_local
    minimal_cut_size = _minimal_cut_size_local


def build_challenge_network(
    num_nodes: int,
    edges: list[tuple[int, int]],
    bond_dims: list[int] | int,
    target_entropy: float,
    dtype: str,
    ops: list[str],
    shape_flat: tuple[int, int] | None = None,
) -> str:
    """Build Ch7 challenge string with graph;bond_dims;target_entropy (or dimensioning-only)."""
    if isinstance(bond_dims, int):
        bond_str = str(bond_dims)
    else:
        bond_str = ",".join(str(d) for d in bond_dims)
    ops_str = ",".join(ops)
    if shape_flat:
        rows, cols = shape_flat
        shape_part = f"tensor:shape=[{rows},{cols}]"
    else:
        d = bond_dims if isinstance(bond_dims, int) else bond_dims[0]
        shape_part = f"tensor:multi_shape=[{d},{d},{d}]"
    if num_nodes > 0 and edges:
        edges_str = ",".join(f"{a}-{b}" for a, b in edges)
        return f"{shape_part};dtype={dtype};nodes={num_nodes};edges={edges_str};bond_dims={bond_str};target_entropy={target_entropy};ops:{ops_str}"
    return f"{shape_part};dtype={dtype};bond_dims={bond_str};target_entropy={target_entropy};ops:{ops_str}"


def build_optimal_path_network(
    cut_size: int,
    bond_dim: int,
    target_entropy: float,
) -> str:
    """Path that includes dimension-consistent and cut steps (proves network constraint)."""
    # Score: normalize entropy to [0,1] style for compatibility (lower = better)
    score_val = round(min(1.0, target_entropy / 12.0), 2)  # cap at ~12 bits
    parts = [
        f"contract:bond_{bond_dim}",
        f"cut:{cut_size}",
        "quant:4bit",
        f"I:{score_val}",
        f"score:{score_val}",
    ]
    return " -> ".join(parts)


def difficulty_from_entropy(target_entropy: float, num_nodes: int) -> float:
    """Larger entropy and graph size => higher difficulty."""
    return round(1 + math.log2(1 + target_entropy) + 0.3 * num_nodes, 4)


def generate_record_ch7() -> dict:
    """Generate one Ch7 (network + dimensioning) challenge record."""
    use_network = random.random() >= 0.2  # 80% network, 20% dimensioning-only
    if use_network:
        n, edges = sample_graph()
        dtype = random.choice(DTYPES)
        bond_dim = random.choice(BOND_DIMS)
        bond_dims: list[int] | int = bond_dim
        if random.random() < 0.3:
            bond_dims = [random.choice(BOND_DIMS) for _ in edges]
        cut_size = minimal_cut_size(n, edges)
        d_eff = bond_dim if isinstance(bond_dims, int) else (sum(bond_dims) // len(bond_dims))
        target_entropy = entropy_from_cut(cut_size, d_eff)
        target_entropy = round(target_entropy, 2)
        if target_entropy <= 0:
            target_entropy = round(entropy_from_cut(1, d_eff), 2)
        n_ops = random.randint(4, 6)
        ops = random.sample(OPS_POOL, min(n_ops, len(OPS_POOL)))
        if "contract" not in ops:
            ops.append("contract")
        if "cut" not in ops:
            ops.append("cut")
        shape_flat = (random.choice([8, 16, 32]), random.choice([8, 16, 32]))
        challenge = build_challenge_network(
            n, edges, bond_dims, target_entropy, dtype, ops, shape_flat=shape_flat
        )
        optimal_path = build_optimal_path_network(cut_size, d_eff, target_entropy)
        return {
            "challenge": challenge,
            "optimal_path": optimal_path,
            "difficulty": difficulty_from_entropy(target_entropy, n),
            "source": "PoT-O/TribeWarez-Ch7",
        }

    # Dimensioning-only branch (multi_shape, no graph)
    dtype = random.choice(DTYPES)
    bond_dim = random.choice(BOND_DIMS)
    target_entropy = round(math.log2(bond_dim), 2)
    if target_entropy <= 0:
        target_entropy = 1.0
    n_ops = random.randint(3, 5)
    ops = random.sample(
        [o for o in OPS_POOL if o in ("contract", "quant4", "quant8", "lowrank", "transpose")],
        min(n_ops, 5),
    )
    if "contract" not in ops:
        ops.append("contract")
    challenge = build_challenge_network(
        0, [], bond_dim, target_entropy, dtype, ops, shape_flat=None
    )
    optimal_path = build_optimal_path_network(1, bond_dim, target_entropy)
    return {
        "challenge": challenge,
        "optimal_path": optimal_path,
        "difficulty": difficulty_from_entropy(target_entropy, 1),
        "source": "PoT-O/TribeWarez-Ch7",
    }


def main() -> None:
    with open(OUTPUT_PATH, "w") as f:
        for _ in range(NUM_RECORDS):
            record = generate_record_ch7()
            f.write(json.dumps(record) + "\n")
    print(f"Wrote {NUM_RECORDS} records to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
