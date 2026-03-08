"""
Tests for manuscript Part IV §4: S = |γ| log d (tensor network entropy).

Run from repo root: python -m tests.test_tensor_network_entropy
Requires: realms-devkit dependencies (quimb). Skip if not installed.
"""
import sys
import unittest
from pathlib import Path

# realms-devkit is sibling of tests/ when run from repo root
REALMS_DEVKIT = Path(__file__).resolve().parent.parent / "realms-devkit"
if str(REALMS_DEVKIT) not in sys.path:
    sys.path.insert(0, str(REALMS_DEVKIT))

try:
    from src import tensor_network as tn
    _tn_available = True
except ImportError:
    _tn_available = False


@unittest.skipIf(not _tn_available, "realms-devkit / quimb not available")
class TestRainbowSEqualsGammaLogD(unittest.TestCase):
    """Rainbow state satisfies S(computed) = |γ| log d at each bond (manuscript Part IV §4)."""

    def test_rainbow_verification_l6(self):
        L = 6
        psi, results = tn.verify_s_equals_gamma_log_d_rainbow(L)
        if not results:
            self.skipTest("quimb not available (no results)")
        self.assertEqual(len(results), L - 1)
        for bond, S_computed, gamma, expected in results:
            self.assertAlmostEqual(
                S_computed, expected, places=5, msg=f"Bond {bond}: S={S_computed} vs |γ|*ln(2)={expected}"
            )

    def test_rainbow_verification_l4(self):
        L = 4
        psi, results = tn.verify_s_equals_gamma_log_d_rainbow(L)
        if not results:
            self.skipTest("quimb not available (no results)")
        for bond, S_computed, gamma, expected in results:
            self.assertAlmostEqual(S_computed, expected, places=5)


if __name__ == "__main__":
    unittest.main()
