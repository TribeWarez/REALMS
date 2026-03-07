# PoT-O Challenge String Format

Spec for synthetic PoT-O (Proof of Tensor Optimizations) challenge encoding. Aligned with TribeWarez PoT-O and with **Part IV — Information-Theoretic Foundation of Spacetime** (manuscript) for tensor dimensioning and networking effects (§3, §4, §7).

## Classic (flat) format

Used by `synthetic-pot-o-challenges-v1`. Pathfinder and validators must accept this.

```
tensor:shape=[M,N];dtype=<dtype>;target_mml=<float>;ops:<op1>,<op2>,...
```

- **shape**: `[M,N]` — matrix dimensions (integer).
- **dtype**: `float16` | `float32` | `int8`.
- **target_mml**: Float in [0.15, 0.55]; MML-style target (lower = better compression).
- **ops**: Comma-separated list of allowed ops (e.g. `matmul`, `lowrank`, `gelu`, `relu`, `quant4`, `quant8`, `prune0.2`, `prune0.4`, `transpose`).

Example:
```
tensor:shape=[32,64];dtype=float16;target_mml=0.42;ops:matmul,lowrank,gelu,quant4,prune0.3,transpose
```

## Chapter 7 (network / tensor-dimensioning) format

Challenges that prove **tensor dimensioning** (bond dimensions, S = |γ| log d) and **networking effects** (graph G=(V,E), minimal cuts, information action). Same JSONL schema: `challenge`, `optimal_path`, `difficulty`, `source`.

### Fields (semicolon-separated)

| Field | Required | Description |
|-------|----------|-------------|
| `tensor:shape=...` | Yes | Either `[M,N]` (classic) or `multi_shape:[d,d,...]` for multi-index tensors (e.g. 3-leg: `[d,d,d]`). |
| `dtype` | Yes | Same as classic. |
| `nodes` | Ch7 | `nodes:N` — number of vertices (quantum subsystems). |
| `edges` | Ch7 | `edges:1-2,2-3,...` — edges as pairs of 1-based node indices. |
| `bond_dims` | Ch7 | `bond_dims:d1,d2,...` — bond dimension per edge (order matches edges) or single `d` for global. Used in S = \|γ\| log d. |
| `target_entropy` | Ch7 | `target_entropy:k` — target from S = \|γ\| log₂(d) (bits). Optional; can use `target_mml` as proxy. |
| `target_mml` | Optional | Same meaning as classic when no `target_entropy`. |
| `weights` | Optional | `weights:w1,w2,...` — coupling J_ij or w_ij per edge for information-action style. |
| `ops` | Yes | Same as classic. |

### Full Ch7 example (graph + bond dims + target entropy)

```
tensor:shape=[8,8];dtype=float32;nodes=3;edges=1-2,2-3,1-3;bond_dims=4,4,4;target_entropy=6;ops:contract,cut,lowrank,quant4
```

Entropy: 3 edges × log₂(4) = 6 bits.

### Dimensioning-only example (multi_shape, no graph)

```
tensor:multi_shape=[4,4,4];dtype=float16;bond_dims=4;target_entropy=2;ops:contract,quant4
```

### Optimal path for Ch7 challenges

Paths can include network-aware steps so the path "proves" the constraint:

- **Dimension-consistent**: e.g. `contract:bond_4`, `contract:d`.
- **Minimal cut**: e.g. `cut:2` (number of edges crossing), `cut:A|B`.
- **Information action**: e.g. `I:0.42`, `I(A:B):0.42`.

Example optimal_path:
```
contract:bond_4 -> cut:2 -> quant:4bit -> I:0.38 -> score:0.36
```

## Parsing rules

- Split challenge string by `;`.
- Key-value pairs: first `:` separates key from value (e.g. `tensor:shape=[8,8]` → key `tensor`, value `shape=[8,8]`; for `shape=` subkey, value is `[8,8]` or `multi_shape:[4,4,4]`).
- `edges` value: comma-separated pairs `a-b`.
- `bond_dims`: comma-separated integers or single integer.
- `weights`: comma-separated numbers (optional).

## Reference

Manuscript **Part IV — Information-Theoretic Foundation of Spacetime**:
- §3 Information network structure: G=(V,E), tensor network, minimal cut structure.
- §4 Tensor network model: T^{i_1..i_k}, bond dim d, S = |γ| log d.
- §7 Spacetime dynamics and information Lagrangian: I(i:j), L_info = Σ J_ij I(i:j) − λ Σ S_i.
