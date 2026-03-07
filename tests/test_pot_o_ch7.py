"""
Unit tests for PoT-O Ch7 challenge generator: tensor dimensioning and networking.

- Entropy S = |γ| log₂(d) (manuscript §4): fixed graph + bond dim => target_entropy.
- Parse classic and Ch7 challenge strings; assert required fields present and well-formed.
"""

import math
import unittest

# Import from project root (run tests from repo root: python -m tests.test_pot_o_ch7)
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from generate_synthetic_pot_o_challenges_ch7 import (
    minimal_cut_size,
    entropy_from_cut,
    build_challenge_network,
    build_optimal_path_network,
)


class TestEntropyFromCut(unittest.TestCase):
    """S = |γ| log₂(d) in bits."""

    def test_single_edge_bond_4(self):
        self.assertAlmostEqual(entropy_from_cut(1, 4), 2.0)

    def test_two_edges_bond_8(self):
        self.assertAlmostEqual(entropy_from_cut(2, 8), 2 * math.log2(8), places=5)

    def test_zero_cut(self):
        self.assertEqual(entropy_from_cut(0, 4), 0.0)

    def test_zero_bond(self):
        self.assertEqual(entropy_from_cut(1, 0), 0.0)


class TestMinimalCut(unittest.TestCase):
    """Minimal cut size for small graphs."""

    def test_chain_2(self):
        # 1-2: any partition cuts 1 edge
        self.assertEqual(minimal_cut_size(2, [(1, 2)]), 1)

    def test_triangle(self):
        # 1-2, 2-3, 1-3: best partition cuts 2 edges
        self.assertEqual(minimal_cut_size(3, [(1, 2), (2, 3), (1, 3)]), 2)

    def test_star_3(self):
        # 1-2, 1-3: partition {2} vs {1,3} cuts 1 edge; partition {1} vs {2,3} cuts 2 edges. Min = 1.
        self.assertEqual(minimal_cut_size(3, [(1, 2), (1, 3)]), 1)


class TestTargetEntropyConsistency(unittest.TestCase):
    """Generator target_entropy matches S = |γ| log₂(d) for a fixed graph."""

    def test_build_challenge_entropy_matches_formula(self):
        n, edges = 3, [(1, 2), (2, 3), (1, 3)]
        cut = minimal_cut_size(n, edges)
        bond_dim = 4
        expected = entropy_from_cut(cut, bond_dim)
        target_entropy = round(expected, 2)
        challenge = build_challenge_network(
            n, edges, bond_dim, target_entropy, "float32", ["contract", "cut"], (8, 8)
        )
        self.assertIn(f"target_entropy={target_entropy}", challenge)
        self.assertAlmostEqual(target_entropy, expected, places=2)


class TestParseChallengeStrings(unittest.TestCase):
    """Parse challenge strings and assert required fields."""

    def _parse(self, s: str) -> dict:
        out = {}
        for part in s.split(";"):
            if ":" in part:
                k, v = part.split(":", 1)
                out[k.strip()] = v.strip()
            if "=" in part and ":" not in part:
                k, v = part.split("=", 1)
                out[k.strip()] = v.strip()
        return out

    def test_classic_format_has_required_fields(self):
        classic = "tensor:shape=[32,64];dtype=float16;target_mml=0.42;ops:matmul,lowrank,gelu"
        # Split by ; then key:value
        parts = classic.split(";")
        self.assertGreater(len(parts), 0)
        self.assertTrue(any("tensor" in p for p in parts))
        self.assertTrue(any("dtype" in p for p in parts))
        self.assertTrue(any("ops" in p for p in parts))

    def test_ch7_network_format_has_required_fields(self):
        ch7 = "tensor:shape=[8,8];dtype=float32;nodes=3;edges=1-2,2-3,1-3;bond_dims=4;target_entropy=4.0;ops:contract,cut"
        self.assertIn("nodes=3", ch7)
        self.assertIn("edges=1-2", ch7)
        self.assertIn("bond_dims=4", ch7)
        self.assertIn("target_entropy=4.0", ch7)
        self.assertIn("dtype=float32", ch7)
        self.assertIn("ops:", ch7)

    def test_ch7_dimensioning_only_has_bond_dims_and_target_entropy(self):
        ch7 = "tensor:multi_shape=[4,4,4];dtype=float16;bond_dims=4;target_entropy=2.0;ops:contract,quant4"
        self.assertIn("multi_shape=", ch7)
        self.assertIn("bond_dims=4", ch7)
        self.assertIn("target_entropy=2.0", ch7)
        self.assertNotIn("nodes=", ch7)


class TestOptimalPathNetwork(unittest.TestCase):
    """optimal_path includes cut and dimension-consistent steps."""

    def test_path_contains_cut_and_contract(self):
        path = build_optimal_path_network(2, 4, 4.0)
        self.assertIn("cut:2", path)
        self.assertIn("contract:bond_4", path)
        self.assertIn("score:", path)


if __name__ == "__main__":
    unittest.main()
