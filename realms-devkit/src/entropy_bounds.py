"""
Entropy bounds and toy checks (manuscript Part I §8, Part IV §1–2).
Compare Bekenstein/BH bounds to toy state count (e.g. qubits in region).
"""
import numpy as np
from .constants import l_P, bekenstein_bound, bekenstein_hawking_area


def saturates_bekenstein(R: float, E: float, S: float) -> bool:
    """Check S ≤ 2π R E / (ℏ c). Returns True if bound is satisfied."""
    return S <= bekenstein_bound(R, E)


def saturates_bh(A: float, S: float) -> bool:
    """Check S ≤ A/(4 G_N) (in natural units). Using S_BH = A/(4 l_P²): check S ≤ S_BH."""
    return S <= bekenstein_hawking_area(A)


def qubit_entropy_max(n_qubits: int) -> float:
    """Max entropy for n qubits: log2(2^n) = n (in bits). In nats: n * ln(2)."""
    return n_qubits * np.log(2)
