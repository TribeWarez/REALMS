"""
Planck units and entropy-bound constants (manuscript Part I §1.1, Part IV §1).
Formulas: l_P = sqrt(ℏ G / c³), t_P = sqrt(ℏ G / c⁵), E_P = sqrt(ℏ c⁵ / G), ν_P = 1/t_P.
Bekenstein S ≤ 2π R E / (ℏ c); Bekenstein–Hawking S_BH = A / (4 G_N) = A / (4 l_P²) in Planck units.
"""
import numpy as np

# SI
G = 6.67430e-11   # m³ kg⁻¹ s⁻²
hbar = 1.054571817e-34  # J·s
c = 299792458.0   # m/s

# Planck units (SI)
l_P = np.sqrt(hbar * G / c**3)
t_P = np.sqrt(hbar * G / c**5)
E_P = np.sqrt(hbar * c**5 / G)
nu_P = 1.0 / t_P

# For entropy bounds we need G_N (Newton constant); in SI G_N = G.
# In Planck units we set ℏ = c = 1, so l_P = sqrt(G_N) => G_N = l_P^2.
G_N = G


def bekenstein_bound(R: float, E: float) -> float:
    """
    Bekenstein bound S ≤ 2π R E / (ℏ c). R in m, E in J; returns upper bound on S (dimensionless).
    """
    return 2.0 * np.pi * R * E / (hbar * c)


def bekenstein_hawking_area(A: float) -> float:
    """
    Bekenstein–Hawking entropy S_BH = A / (4 G_N) = A / (4 l_P²) in Planck units.
    A in m²; returns S_BH (dimensionless). In SI: S_BH = A c³ / (4 G ℏ).
    """
    return (A * c**3) / (4.0 * G_N * hbar)
