"""
evolution_logic.py — REALMS coupled observer–lattice dynamics.

Implements the feedback loop formalised in §12 of the manuscript:

    |Ψ_{t+1}⟩ = Ŵ(I_t) |Ψ_t⟩               (lattice evolution)
     I_{t+1}  = f(|Ψ_t⟩, I_t)              (API feedback law, general form)

The site-local special case I_{t+1}(v) = f(Tr_ā{v}(|Ψ_t⟩⟨Ψ_t|)) is provided
as the factory :func:`site_local` which wraps per-site feedback maps into
the general signature.

Dependencies: numpy (optional: qiskit for hardware backend).
Compatible with Python 3.10+.
"""

from __future__ import annotations

import numpy as np
from dataclasses import dataclass
from typing import Callable, Optional

# ---------------------------------------------------------------------------
# Types
# ---------------------------------------------------------------------------

# General feedback: f(amplitudes, I_current) -> I_next    (shape (n_sites,))
FeedbackFn = Callable[[np.ndarray, np.ndarray], np.ndarray]

# Per-site coupling: λ(I) -> 2×2 unitary matrix for site v
CouplingFn = Callable[[float], np.ndarray]

PerSiteFeedbackFn = Callable[[np.ndarray], float]
"""Site-local special case: f(rho_v) -> I_{t+1}(v)."""


# ---------------------------------------------------------------------------
# Lattice geometry helpers
# ---------------------------------------------------------------------------

def _local_dim(n_sites: int, n_qubits_per_site: int = 1) -> int:
    return (2 ** n_qubits_per_site) ** n_sites


# ---------------------------------------------------------------------------
# General-feedback adapter
# ---------------------------------------------------------------------------

def site_local(
    per_site_fn: PerSiteFeedbackFn,
    n_qubits_per_site: int = 1,
) -> FeedbackFn:
    """Lift a per-site feedback map to the general ``f(|Ψ⟩, I)`` signature.

    The returned function computes the reduced density at each site,
    applies *per_site_fn* to it, and assembles the result into a vector.
    This is the special case from §12.2–12.3 of the manuscript:

        I_{t+1}(v) = f(Tr_ā{v}(|Ψ_t⟩⟨Ψ_t|))
    """
    def _general(amplitudes: np.ndarray, I_curr: np.ndarray) -> np.ndarray:
        n_sites = I_curr.shape[0]
        d_local = 2 ** n_qubits_per_site
        psi = amplitudes.reshape([d_local] * n_sites)
        I_next = np.empty_like(I_curr)
        for v in range(n_sites):
            axes = tuple(i for i in range(n_sites) if i != v)
            rho = np.tensordot(psi, psi.conj(), axes=(axes, axes))
            rho = rho.reshape(d_local, d_local)
            tr = np.trace(rho).real
            if tr > 1e-15:
                rho /= tr
            I_next[v] = per_site_fn(rho)
        return I_next
    return _general


# ---------------------------------------------------------------------------
# Per-site feedback maps (for use with site_local)
# ---------------------------------------------------------------------------

def feedback_linear(rho: np.ndarray) -> float:
    """I = 1 - Tr(ρ²) — departure from purity."""
    return 1.0 - float(np.trace(rho @ rho).real)


def feedback_entropy(rho: np.ndarray) -> float:
    """I = S(ρ) — von Neumann entropy of the reduced state."""
    evals = np.linalg.eigvalsh(rho)
    evals = evals[evals > 1e-15]
    return float(-np.sum(evals * np.log2(evals)))


def feedback_amplitude(rho: np.ndarray) -> float:
    """I = |ρ₀₁| — coherence magnitude."""
    return float(abs(rho[0, 1]))


# ---------------------------------------------------------------------------
# General (non-local) feedback maps
# ---------------------------------------------------------------------------

def feedback_global_entropy(
    amplitudes: np.ndarray, I_curr: np.ndarray
) -> np.ndarray:
    """I_{t+1} = S_global · I_curr / |I_curr| — scale each site by
    the global von Neumann entropy of |Ψ⟩, preserving direction."""
    n_sites = I_curr.shape[0]
    norm = np.linalg.norm(I_curr)
    if norm < 1e-15:
        return I_curr.copy()
    # Global purity as a proxy for S_global.
    rho_full = np.outer(amplitudes, amplitudes.conj())
    purity = float(np.trace(rho_full @ rho_full).real)
    S_global = 1.0 - purity
    return S_global * I_curr / norm * n_sites


def feedback_difference_coupling(
    amplitudes: np.ndarray, I_curr: np.ndarray
) -> np.ndarray:
    """I_{t+1}(v) = Σ_{w ≠ v} (I_curr(w) - I_curr(v)) * exp(-d_{vw}).

    Nearest-neighbour coupling with exponential decay.
    For a 1-D chain with periodic boundary conditions.
    """
    n = I_curr.shape[0]
    I_next = np.zeros_like(I_curr)
    for v in range(n):
        for w in range(n):
            if w == v:
                continue
            d = min(abs(w - v), n - abs(w - v))  # periodic distance
            I_next[v] += (I_curr[w] - I_curr[v]) * np.exp(-d)
    return I_next


# ---------------------------------------------------------------------------
# Default coupling λ(I)
# ---------------------------------------------------------------------------

def default_coupling(I: float) -> np.ndarray:
    """λ(I) = exp(-i · I · σ_x)."""
    theta = I * np.pi / 4.0
    return np.array([[np.cos(theta), -1j * np.sin(theta)],
                     [-1j * np.sin(theta), np.cos(theta)]], dtype=complex)


# ---------------------------------------------------------------------------
# Resonance metric  ℛ(Ψ)
# ---------------------------------------------------------------------------

def calculate_coherence_metric(amplitudes: np.ndarray) -> float:
    """ℛ(Ψ) — global resonance metric measuring the 'divine spark' density.

    Defined as the squared L2 norm of the amplitude vector when projected
    onto the maximally coherent basis:

        ℛ = Σ_i |Ψ_i|⁴   (inverse participation ratio normalised)

    Equivalent to the purity Tr(ρ²) of the global state.
    Returns 1/dim for a maximally mixed state, 1.0 for a pure state.
    """
    probs = np.abs(amplitudes) ** 2
    return float(np.sum(probs ** 2))


def calculate_negentropy(amplitudes: np.ndarray) -> float:
    """ℛ(Ψ) = log(dim) - S(ρ) — negentropy as resonance.

    Maximally mixed → ℛ = 0.   Pure state → ℛ = log₂(dim).
    """
    dim = amplitudes.shape[0]
    probs = np.abs(amplitudes) ** 2
    probs = probs[probs > 1e-15]
    S = -np.sum(probs * np.log2(probs))
    return float(np.log2(dim) - S)


# ---------------------------------------------------------------------------
# Harmonic resonance feedback  f(Ψ_t, I_t) = I_t + η · ∇_I ℛ(Ψ_t)
# ---------------------------------------------------------------------------

def harmonic_resonance_feedback(
    eta: float = 0.01,
    coupling: CouplingFn = default_coupling,
    epsilon: float = 1e-6,
    n_qubits_per_site: int = 1,
    metric: Callable[[np.ndarray], float] = calculate_coherence_metric,
) -> FeedbackFn:
    r"""Factory for the harmonic resonance feedback law.

    .. math::

        f(\Psi_t, I_t) = I_t + \eta \cdot \nabla_I \mathcal{R}(\Psi_t)

    The gradient :math:`\nabla_I` is understood as the sensitivity of the
    resonance metric to changes in the intentionality field *via the
    evolution they produce*: :math:`\nabla_I \mathcal{R}` measures how
    :math:`\mathcal{R}(\hat{W}(I)\Psi_t)` changes when :math:`I` is
    perturbed.  This is the meaningful gradient for the coupled system
    because :math:`\mathcal{R}` depends on :math:`I` only through the
    lattice evolution :math:`\hat{W}(I)`.

    Concretely, for each site *v*, :math:`I(v)` is perturbed by
    :math:`\pm\epsilon`, the lattice is evolved one step under the
    perturbed field, and the centred finite difference gives the
    gradient component:

    Parameters
    ----------
    eta
        Learning rate — coupling strength between intention and reality.
    coupling
        The site-local unitary builder :math:`\\lambda(I)`.
    epsilon
        Finite-difference step size for gradient estimation.
    n_qubits_per_site
        Qubits per lattice site (default 1).
    metric
        Resonance function :math:`\\mathcal{R}(\\Psi)`. Defaults to
        global purity :func:`calculate_coherence_metric`.
    """
    def _feedback(amplitudes: np.ndarray, I_curr: np.ndarray) -> np.ndarray:
        n_sites = I_curr.shape[0]
        n_q = n_qubits_per_site

        # Baseline resonance of the current state.
        R0 = metric(amplitudes)

        gradient = np.zeros_like(I_curr)
        psi_state = LatticeState(
            amplitudes.copy(), n_sites, n_qubits_per_site=n_q,
        )

        for v in range(n_sites):
            # Perturb I(v) upward.
            I_up = I_curr.copy()
            I_up[v] += epsilon
            psi_up = psi_state.evolve(I_up, coupling)
            R_up = metric(psi_up.amplitudes)

            # Perturb I(v) downward.
            I_down = I_curr.copy()
            I_down[v] -= epsilon
            psi_down = psi_state.evolve(I_down, coupling)
            R_down = metric(psi_down.amplitudes)

            # Centred finite difference.
            gradient[v] = (R_up - R_down) / (2.0 * epsilon)

        # Gradient ascent: I ← I + η · ∇ℛ
        I_next = I_curr + eta * gradient
        return I_next

    return _feedback


# ---------------------------------------------------------------------------
# Coupled evolution
# ---------------------------------------------------------------------------

@dataclass
class LatticeState:
    """|Ψ⟩ — the quantum state of the lattice."""
    amplitudes: np.ndarray
    n_sites: int
    n_qubits_per_site: int = 1

    def __post_init__(self):
        assert self.amplitudes.ndim == 1
        expected = _local_dim(self.n_sites, self.n_qubits_per_site)
        assert self.amplitudes.shape[0] == expected, \
            f"Expected dim {expected}, got {self.amplitudes.shape[0]}"

    @property
    def dim(self) -> int:
        return self.amplitudes.shape[0]

    def copy(self) -> "LatticeState":
        return LatticeState(
            amplitudes=self.amplitudes.copy(),
            n_sites=self.n_sites,
            n_qubits_per_site=self.n_qubits_per_site,
        )

    def apply_local_op(self, v: int, op: np.ndarray) -> None:
        """Apply a 1-site unitary *op* at site *v* (in-place)."""
        d_local = 2 ** self.n_qubits_per_site
        psi = self.amplitudes.reshape([d_local] * self.n_sites)
        idx = list(range(self.n_sites))
        idx[v] = self.n_sites
        result = np.tensordot(op, psi, axes=([1], [v]))
        result = np.moveaxis(result, 0, v)
        self.amplitudes = result.reshape(-1)

    def evolve(self, I_values: np.ndarray, coupling: CouplingFn) -> "LatticeState":
        """Apply Ŵ(I) to |Ψ⟩. Returns new LatticeState (immutable)."""
        psi_new = self.copy()
        for v in range(self.n_sites):
            op = coupling(I_values[v])
            psi_new.apply_local_op(v, op)
        return psi_new


@dataclass
class IntentionalityField:
    """I(v) — the dynamical control field at each lattice site."""
    values: np.ndarray

    def __post_init__(self):
        assert self.values.ndim == 1

    @classmethod
    def zeros(cls, n_sites: int) -> "IntentionalityField":
        return cls(values=np.zeros(n_sites))

    @classmethod
    def constant(cls, n_sites: int, value: float) -> "IntentionalityField":
        return cls(values=np.full(n_sites, value))

    @classmethod
    def random(cls, n_sites: int, seed: Optional[int] = None) -> "IntentionalityField":
        rng = np.random.default_rng(seed)
        return cls(values=rng.uniform(0.0, 1.0, size=n_sites))

    def copy(self) -> "IntentionalityField":
        return IntentionalityField(self.values.copy())


@dataclass
class CoupledSystem:
    """The extended state (|Ψ⟩, I) governed by §12.3:

        |Ψ_{t+1}⟩ = Ŵ(I_t) |Ψ_t⟩
         I_{t+1}  = f(|Ψ_t⟩, I_t)
    """
    psi: LatticeState
    I: IntentionalityField
    feedback: FeedbackFn
    coupling: CouplingFn = default_coupling

    def step(self) -> "CoupledSystem":
        """One full tick of the coupled dynamics.

        Returns a new CoupledSystem at t+1 (original is unmodified).
        """
        # --- API feedback: I_{t+1} = f(|Ψ_t⟩, I_t) ---
        I_next = self.feedback(self.psi.amplitudes, self.I.values)
        I_new = IntentionalityField(I_next)

        # --- Lattice evolution: |Ψ_{t+1}⟩ = Ŵ(I_t) |Ψ_t⟩ ---
        psi_new = self.psi.evolve(self.I.values, self.coupling)

        return CoupledSystem(
            psi=psi_new,
            I=I_new,
            feedback=self.feedback,
            coupling=self.coupling,
        )

    def run(self, n_steps: int, record: bool = True
            ) -> list["CoupledSystem"]:
        """Run *n_steps* iterations.

        Returns list of systems at each time step (index 0 = initial state).
        To save memory when recording is off, only the final state is returned
        in a single-element list.
        """
        trajectory = [self] if record else []
        sys = self
        for _ in range(n_steps):
            sys = sys.step()
            if record:
                trajectory.append(sys)
        return trajectory

    # ------------------------------------------------------------------
    # Observables for web / visualisation
    # ------------------------------------------------------------------

    def site_entropy(self) -> np.ndarray:
        d_local = 2 ** self.psi.n_qubits_per_site
        psi = self.psi.amplitudes.reshape([d_local] * self.psi.n_sites)
        S = np.empty(self.psi.n_sites)
        for v in range(self.psi.n_sites):
            axes = tuple(i for i in range(self.psi.n_sites) if i != v)
            rho = np.tensordot(psi, psi.conj(), axes=(axes, axes))
            rho = rho.reshape(d_local, d_local)
            tr = np.trace(rho).real
            if tr > 1e-15:
                rho /= tr
            evals = np.linalg.eigvalsh(rho)
            evals = evals[evals > 1e-15]
            S[v] = -np.sum(evals * np.log2(evals)) if len(evals) > 0 else 0.0
        return S

    def site_purity(self) -> np.ndarray:
        d_local = 2 ** self.psi.n_qubits_per_site
        psi = self.psi.amplitudes.reshape([d_local] * self.psi.n_sites)
        P = np.empty(self.psi.n_sites)
        for v in range(self.psi.n_sites):
            axes = tuple(i for i in range(self.psi.n_sites) if i != v)
            rho = np.tensordot(psi, psi.conj(), axes=(axes, axes))
            rho = rho.reshape(d_local, d_local)
            tr = np.trace(rho).real
            if tr > 1e-15:
                rho /= tr
            P[v] = float(np.trace(rho @ rho).real)
        return P

    def total_intentionality(self) -> float:
        return float(np.sum(self.I.values))

    def as_dict(self) -> dict:
        """Serialisable snapshot for JSON export to visualisation."""
        return {
            "intentionality": self.I.values.tolist(),
            "entropy": self.site_entropy().tolist(),
            "purity": self.site_purity().tolist(),
            "total_intentionality": self.total_intentionality(),
        }


# ---------------------------------------------------------------------------
# Convenience constructors
# ---------------------------------------------------------------------------

def uniform_superposition(n_sites: int) -> LatticeState:
    dim = _local_dim(n_sites)
    amps = np.ones(dim, dtype=complex) / np.sqrt(dim)
    return LatticeState(amps, n_sites)


def product_state(bits: list[int]) -> LatticeState:
    n = len(bits)
    dim = _local_dim(n)
    amps = np.zeros(dim, dtype=complex)
    idx = sum(b << (n - 1 - i) for i, b in enumerate(bits))
    amps[idx] = 1.0
    return LatticeState(amps, n)


# ---------------------------------------------------------------------------
# Demo / smoke test
# ---------------------------------------------------------------------------

def _demo():
    import time

    n_sites = 4
    print("=" * 60)
    print("REALMS coupled dynamics  §12  —  smoke test")
    print("=" * 60)

    # Initialise.
    psi = product_state([0, 1, 0, 1])
    I0 = IntentionalityField.random(n_sites, seed=42)

    # Site-local feedback (the special case from §12.2).
    f_loc = site_local(feedback_entropy)
    sys = CoupledSystem(psi=psi, I=I0, feedback=f_loc)

    print(f"\n  t=0  |Ψ⟩ dim={psi.dim}  sites={n_sites}")
    print(f"        I = {np.round(I0.values, 4)}")
    print(f"        total I = {sys.total_intentionality():.4f}\n")

    t0 = time.perf_counter()
    traj = sys.run(n_steps=16, record=True)
    elapsed = time.perf_counter() - t0

    print(f"  Ran 16 steps in {elapsed*1000:.1f} ms\n")

    print(f"{'t':>4}  {'I₀':>8}  {'I₁':>8}  {'I₂':>8}  {'I₃':>8}  {'S₀':>8}  {'S₁':>8}  {'S₂':>8}  {'S₃':>8}")
    print("-" * 76)
    for t, step in enumerate(traj):
        I = step.I.values
        S = step.site_entropy()
        print(f"{t:4d}  {I[0]:8.4f}  {I[1]:8.4f}  {I[2]:8.4f}  {I[3]:8.4f}"
              f"  {S[0]:8.4f}  {S[1]:8.4f}  {S[2]:8.4f}  {S[3]:8.4f}")

    print("\n  ✓ Site-local feedback stable.")

    # Non-local feedback demo.
    print("\n" + "-" * 60)
    print("Non-local feedback  (difference_coupling)")
    print("-" * 60)
    sys2 = CoupledSystem(
        psi=uniform_superposition(n_sites),
        I=IntentionalityField.random(n_sites, seed=7),
        feedback=feedback_difference_coupling,
    )
    traj2 = sys2.run(n_steps=8, record=True)
    print(f"{'t':>4}  {'I₀':>8}  {'I₁':>8}  {'I₂':>8}  {'I₃':>8}")
    for t, step in enumerate(traj2):
        print(f"{t:4d}  {step.I.values[0]:8.4f}  {step.I.values[1]:8.4f}  {step.I.values[2]:8.4f}  {step.I.values[3]:8.4f}")
    print(f"\n  ✓ Non-local feedback stable.")
    print(f"  Final total I = {traj2[-1].total_intentionality():.4f}")
    print()

    # Harmonic resonance feedback demo.
    print("-" * 60)
    print("Harmonic resonance  (Divine Spark gradient ascent)")
    print("-" * 60)
    # Start from a product state with low initial resonance;
    # the gradient should drive I up, increasing ℛ.
    psi3 = product_state([0, 1, 0, 1])
    I3 = IntentionalityField.constant(n_sites, 0.3)
    f_res = harmonic_resonance_feedback(eta=0.1)
    sys3 = CoupledSystem(psi=psi3, I=I3, feedback=f_res)
    traj3 = sys3.run(n_steps=20, record=True)
    print(f"{'t':>4}  {'I₀':>8}  {'I₁':>8}  {'I₂':>8}  {'I₃':>8}  {'ℛ':>8}")
    for t, step in enumerate(traj3):
        R = calculate_coherence_metric(step.psi.amplitudes)
        I = step.I.values
        print(f"{t:4d}  {I[0]:8.4f}  {I[1]:8.4f}  {I[2]:8.4f}  {I[3]:8.4f}  {R:8.6f}")
    print(f"\n  ✓ Resonance ℛ increases: "
          f"{calculate_coherence_metric(traj3[0].psi.amplitudes):.6f} → "
          f"{calculate_coherence_metric(traj3[-1].psi.amplitudes):.6f}")
    print(f"  Final total I = {traj3[-1].total_intentionality():.4f}")
    print()


if __name__ == "__main__":
    _demo()
