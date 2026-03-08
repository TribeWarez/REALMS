"""
Stdlib-only helpers for Ch7 cluster generator (manuscript Part IV §3–4).

S = |γ| log₂(d) in bits; minimal cut size for small graphs.
No numpy/quimb — for use on Pi/ESP and by generate_synthetic_pot_o_challenges_ch7_cluster.py.
"""

import math


def entropy_from_cut_bits(num_edges_cut: int, bond_dim: int) -> float:
    """S = |γ| log₂(d) in bits (manuscript §4)."""
    if num_edges_cut <= 0 or bond_dim <= 0:
        return 0.0
    return num_edges_cut * math.log2(bond_dim)


def minimal_cut_size(n: int, edges: list[tuple[int, int]]) -> int:
    """Minimum number of edges that separate the graph (bipartition). Nodes 1..n."""
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
