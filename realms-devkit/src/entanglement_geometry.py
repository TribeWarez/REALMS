"""
Entanglement defines geometry (manuscript Part IV §2.3, §6).
I(A:B) = S(A) + S(B) - S(A∪B), d(A,B) ~ -log I(A:B).
From global state (Qiskit or quimb) compute reduced ρ_A, ρ_B, ρ_AB, entropies, mutual info, effective distance.
"""
import numpy as np

# Optional: Qiskit for statevector/density matrix
try:
    from qiskit.quantum_info import Statevector, DensityMatrix, partial_trace, entropy
    _qiskit_available = True
except ImportError:
    _qiskit_available = False

try:
    import quimb.tensor as qtn
    _quimb_available = True
except ImportError:
    _quimb_available = False


def von_neumann_entropy(rho: np.ndarray) -> float:
    """Von Neumann entropy S = -Tr(ρ log ρ) in nats. rho is density matrix."""
    evals = np.linalg.eigvalsh(rho)
    evals = evals[evals > 1e-14]
    return float(-np.sum(evals * np.log(evals)))


def mutual_information(S_A: float, S_B: float, S_AB: float) -> float:
    """I(A:B) = S(A) + S(B) - S(A∪B). All entropies in same units (nats)."""
    return S_A + S_B - S_AB


def effective_distance(I_AB: float, eps: float = 1e-10) -> float:
    """d(A,B) ~ -log I(A:B) (manuscript Part IV §2.3). Returns value in nats.
    Use eps to avoid log(0). Note: d can be negative when I(A:B) > 1 (e.g. Bell pair
    has I = 2 ln(2) nats); for a positive-distance interpretation use bits or normalize I."""
    I = max(I_AB, eps)
    return -np.log(I)


def entropy_and_mutual_info_from_density(
    rho_A: np.ndarray,
    rho_B: np.ndarray,
    rho_AB: np.ndarray,
) -> tuple[float, float, float, float, float]:
    """
    Given reduced density matrices ρ_A, ρ_B, ρ_{A∪B}, compute S(A), S(B), S(AB), I(A:B), d_eff.
    Returns (S_A, S_B, S_AB, I_AB, d_eff) in nats.
    """
    S_A = von_neumann_entropy(rho_A)
    S_B = von_neumann_entropy(rho_B)
    S_AB = von_neumann_entropy(rho_AB)
    I_AB = mutual_information(S_A, S_B, S_AB)
    d_eff = effective_distance(I_AB)
    return (S_A, S_B, S_AB, I_AB, d_eff)


def from_qiskit_statevector(statevector, qubits_A: list, qubits_B: list):
    """
    From Qiskit Statevector, trace out complements to get ρ_A, ρ_B, ρ_{A∪B}.
    qubits_A, qubits_B are lists of qubit indices (0-based).
    Returns (S_A, S_B, S_AB, I_AB, d_eff) and (rho_A, rho_B, rho_AB).
    """
    if not _qiskit_available:
        raise ImportError("qiskit is required")
    if hasattr(statevector, "data"):
        statevector = Statevector(statevector.data)
    elif not isinstance(statevector, Statevector):
        statevector = Statevector(statevector)
    n = statevector.num_qubits
    all_qubits = list(range(n))
    comp_A = [q for q in all_qubits if q not in qubits_A]
    comp_B = [q for q in all_qubits if q not in qubits_B]
    AB = list(dict.fromkeys(qubits_A + qubits_B))
    comp_AB = [q for q in all_qubits if q not in AB]
    rho = DensityMatrix(statevector)
    rho_A = partial_trace(rho, comp_A).data
    rho_B = partial_trace(rho, comp_B).data
    rho_AB = partial_trace(rho, comp_AB).data if comp_AB else rho.data
    S_A, S_B, S_AB, I_AB, d_eff = entropy_and_mutual_info_from_density(rho_A, rho_B, rho_AB)
    return (S_A, S_B, S_AB, I_AB, d_eff), (rho_A, rho_B, rho_AB)


def rt_toy_entropy_vs_boundary(psi_mps, site_labels=None):
    """
    Ryu–Takayanagi toy: for 1D MPS, S(region A) = entropy at cut = f(boundary size).
    psi_mps: quimb MPS. Returns list of (n_sites_A, S_A) for n_sites_A = 1, 2, ..., L-1.
    quimb MPS.entropy(i) requires 0 < i < L; bond i is between site i-1 and i, so left block has i sites.
    """
    if not _quimb_available:
        return []
    L = psi_mps.L
    out = []
    for bond in range(1, L):  # quimb: bond index 1..L-1
        S_bits = float(psi_mps.entropy(bond))
        S_nats = S_bits * np.log(2)
        out.append((bond, S_nats))  # n_sites in left block = bond; S in nats
    return out


def information_action(I_ij: dict, weights: dict = None) -> float:
    """
    Manuscript Part IV §7: I = sum_{i,j} w_ij I(i:j).
    I_ij: dict mapping (i,j) or (j,i) to mutual information (nats).
    weights: optional dict w_ij; if None, w_ij=1 for all pairs.
    """
    total = 0.0
    seen = set()
    for (i, j), val in I_ij.items():
        key = (min(i, j), max(i, j))
        if key in seen:
            continue
        seen.add(key)
        w = 1.0 if weights is None else weights.get(key, weights.get((j, i), 1.0))
        total += w * val
    return total


def information_lagrangian_value(I_ij: dict, S_i: dict, J_ij: dict = None, lam: float = 0.0) -> float:
    """
    L_info = sum_{i,j} J_ij I(i:j) - lambda sum_i S_i (Part IV §7).
    S_i: dict i -> local entropy. J_ij: optional coupling; if None, J_ij=1.
    """
    term1 = information_action(I_ij, J_ij)
    term2 = lam * sum(S_i.values())
    return term1 - term2
