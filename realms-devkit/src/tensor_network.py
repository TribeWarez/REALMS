"""
Tensor network model of spacetime (manuscript Part IV §3–4).
Build small 1D/2D tensor networks with edges as maximally entangled pairs;
verify S = |γ| log d for a cut γ.
"""
import numpy as np

try:
    import quimb.tensor as qtn
except ImportError:
    qtn = None


def build_chain_bell_pairs(L: int, d: int = 2):
    """
    Build 1D chain of L sites (currently GHZ state).
    Returns MPS. For GHZ, entropy at every bond is 1 bit (ln(2) nats); S(expected) = |γ| ln(2) does not match.
    """
    if qtn is None:
        raise ImportError("quimb is required. Install with: pip install quimb")
    return qtn.MPS_ghz_state(L, dtype=complex)


def build_chain_bell_pairs_rainbow(L: int, d: int = 2):
    """
    Build MPS for a chain where entanglement follows S = |γ| log d: "rainbow" state
    with Bell pairs (0, L-1), (1, L-2), ... so that at bond i the entropy is
    min(i, L - 1 - i) * ln(d) nats (after bits→nats conversion).
    Returns quimb MPS. Used to verify S(computed) ≈ S(expected) numerically.
    """
    if qtn is None:
        raise ImportError("quimb is required. Install with: pip install quimb")
    if d != 2:
        raise NotImplementedError("build_chain_bell_pairs_rainbow only implemented for d=2")
    # State: product of Bell pairs (|00⟩+|11⟩)/√2 on (0,L-1), (1,L-2), ..., (k-1,k) for L=2k.
    # Sites 0..n_pairs-1 and L-1..n_pairs are paired: site i and L-1-i have same digit.
    n_pairs = L // 2
    state = np.zeros((d ** L,), dtype=complex)
    norm = 1.0 / np.sqrt(d ** n_pairs)
    for config in range(d ** n_pairs):
        # config = s0 + s1*d + s2*d^2 + ... (n_pairs digits). Site i gets digit (config // d^i) % d; site L-1-i same.
        flat_idx = 0
        for site in range(L):
            partner = min(site, L - 1 - site)
            digit = (config // (d ** partner)) % d
            flat_idx += digit * (d ** site)
        state[flat_idx] = norm
    # quimb may expect shape (d,d,...,d); try 1D with dims (API may vary)
    try:
        psi = qtn.MPS_from_dense(state, dims=[d] * L)
    except Exception:
        psi = qtn.MPS_from_dense(state.reshape([d] * L), dims=[d] * L)
    return psi


def entropy_at_bond(psi, bond: int):
    """Von Neumann entropy at bond (between site bond and bond+1). Returns entropy in nats.
    quimb returns base-2 entropy (bits); we convert to nats for consistency with cut_size_to_entropy.
    """
    if qtn is None:
        raise ImportError("quimb is required")
    S_bits = float(psi.entropy(bond))
    return S_bits * np.log(2)


def cut_size_to_entropy(num_bonds: int, d: int = 2) -> float:
    """Manuscript formula: S = |γ| log d (nats)."""
    return num_bonds * np.log(d)


def verify_s_equals_gamma_log_d(chain_length: int = 6, psi=None, d: int = 2):
    """
    Verify that entropy at a cut equals number of bonds cut × log(d) (S = |γ| log d).
    If psi is None, builds GHZ(chain_length). Otherwise uses provided MPS (chain_length = psi.L).
    quimb MPS.entropy(i) requires 0 < i < L (1-based bond index). Bond i is between site i-1 and i.
    Returns list of (bond_1based, S_computed, |γ|, expected_S). All entropies in nats.
    """
    if qtn is None:
        return []
    if psi is None:
        psi = build_chain_bell_pairs(chain_length)
    L = psi.L
    results = []
    for bond in range(1, L):
        S = entropy_at_bond(psi, bond)
        gamma = min(bond, L - bond)
        expected = cut_size_to_entropy(gamma, d)
        results.append((bond, S, gamma, expected))
    return results


def verify_s_equals_gamma_log_d_rainbow(chain_length: int = 6):
    """
    Build rainbow (Bell-pair) chain and verify S(computed) ≈ S(expected) for S = |γ| log d.
    Returns (psi, results) with results as from verify_s_equals_gamma_log_d.
    """
    if qtn is None:
        return None, []
    psi = build_chain_bell_pairs_rainbow(chain_length)
    results = verify_s_equals_gamma_log_d(chain_length=chain_length, psi=psi, d=2)
    return psi, results
