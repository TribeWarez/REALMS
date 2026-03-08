# REALMS dev-kit

Dockerized Python 3 + Qiskit + tensor-network (quimb) environment to **prove or investigate** the thesis in the REALMS manuscript, especially **Part IV — Information-Theoretic Foundation of Spacetime** (tensor networks, entanglement–geometry, holographic bounds, information Lagrangian).

## Quick start

**Build and run with Docker:**

```bash
docker build -t realms-devkit .
docker run -p 8888:8888 -v $(pwd):/workspace realms-devkit
```

Then open the URL shown in the log (e.g. `http://127.0.0.1:8888/lab?token=...`) to use Jupyter Lab.

**Or with Docker Compose:**

```bash
docker compose up --build
```

Then open `http://localhost:8888` (use the token printed in the logs).

## References

- **Manuscript:** [manuscript-combined.md](../manuscript-combined.md) (and Part IV in [REALMS-Information-Spacetime.md](../REALMS-Information-Spacetime.md)).
- **Qiskit:** [IBM Quantum — Qiskit](https://www.ibm.com/quantum/qiskit) — install, ecosystem, `pip install qiskit`.
- **IBM Quantum docs:** [Introduction | IBM Quantum Documentation](https://quantum.cloud.ibm.com/docs/en/guides) — quickstart, tutorials, execution.

## Manuscript → dev-kit mapping

| Manuscript section | Notebook | Module |
|--------------------|----------|--------|
| Part I §1.1, Part IV §1 — Planck units, Bekenstein/BH bounds | [01_planck_and_bounds.ipynb](notebooks/01_planck_and_bounds.ipynb) | `src/constants.py`, `src/entropy_bounds.py` |
| Part IV §3–4 — Tensor network, S = \|γ\| log d | [02_tensor_network_entropy.ipynb](notebooks/02_tensor_network_entropy.ipynb) | `src/tensor_network.py` |
| Part IV §2.3, §6 — I(A:B), d(A,B), Ryu–Takayanagi toy | [03_entanglement_geometry.ipynb](notebooks/03_entanglement_geometry.ipynb) | `src/entanglement_geometry.py` |
| Part IV §7 — Information Lagrangian | [04_information_lagrangian.ipynb](notebooks/04_information_lagrangian.ipynb) | `src/entanglement_geometry.py` |
| Part IV postulates, Part I decoherence — Qiskit state, S(A) | [05_qiskit_circuits_entropy.ipynb](notebooks/05_qiskit_circuits_entropy.ipynb) | Qiskit + `src/entanglement_geometry.py` |

## Proof vs investigation

- **Numerical checks:** Planck constants, Bekenstein/BH formulas; tensor network entropy S = \|γ\| log d (notebook 02); mutual information and effective distance (notebook 03).
- **Exploratory:** Information Lagrangian extremization (notebook 04); scaling and toy RT (notebook 03).

## PoT-O cluster

The same S = \|γ\| log d and I(A:B) formulas verified in this devkit are used by the **Ch7 cluster generator** in the repo root ([generate_synthetic_pot_o_challenges_ch7_cluster.py](../generate_synthetic_pot_o_challenges_ch7_cluster.py)) to produce sharded PoT-O challenge datasets. The cluster script uses stdlib-only versions of these formulas so it runs on Raspberry Pi and ESP32; this devkit is the reference implementation. See [CLUSTER.md](../CLUSTER.md) for usage. Generated data: [synthetic-pot-o-challenges-ch7-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-ch7-v1) and shards `Tribewarez/synthetic-pot-o-challenges-ch7-cluster-XXXX`.

## Layout

```
realms-devkit/
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
├── README.md
├── src/
│   ├── __init__.py
│   ├── constants.py         # Planck units, Bekenstein/BH
│   ├── entropy_bounds.py    # Bounds and toy saturation
│   ├── entanglement_geometry.py  # I(A:B), d_eff, L_info
│   ├── tensor_network.py    # TN build, cut entropy
│   └── ch7_cluster_utils.py # Stdlib-only S = |γ| log d, minimal_cut (for cluster generator)
├── scripts/
│   └── validate_ch7_shard.py  # Validate Ch7 JSONL (target_entropy vs S = |γ| log d)
└── notebooks/
    ├── 01_planck_and_bounds.ipynb
    ├── 02_tensor_network_entropy.ipynb
    ├── 03_entanglement_geometry.ipynb
    ├── 04_information_lagrangian.ipynb
    └── 05_qiskit_circuits_entropy.ipynb
```

Run notebooks from the `realms-devkit` directory (or set `sys.path` so that `src` is importable; notebooks use `sys.path.insert(0, '..')` when run with workspace root = `realms-devkit`). When using Docker, the working directory is `/workspace`, so run from `/workspace` and use `sys.path.insert(0, '..')` from `notebooks/` to load `src` (i.e. parent of cwd = `realms-devkit` = workspace). So when you're inside the container at `/workspace`, the repo might be mounted as `/workspace` = realms-devkit. So notebooks live in `/workspace/notebooks` and src in `/workspace/src`. Then from a notebook in `notebooks/`, `sys.path.insert(0, '..')` adds `/workspace` so `from src.constants import ...` works. Good.