---
license: mit
language:
  - en
tags:
  - synthetic
  - pot-o
  - tensor-optimization
  - proof-of-tensor
  - tribewarez
  - live-beta
task_categories:
  - text-generation
---

# synthetic-pot-o-challenges-v1

**Tiny synthetic starter dataset** for training PoT-O (Proof of Tensor Optimizations) pathfinder models.

## Format (JSONL)

```json
{"challenge": "tensor:shape=[32,64];dtype=float16;target_mml=0.42;ops:matmul,lowrank,gelu,quant4,prune0.3,transpose", "optimal_path": "path: matmul[lowrank:16] -> relu -> quant:4bit -> prune:0.35 -> score:0.418"}
```

- **challenge**: Text encoding of tensor properties & allowed operations
- **optimal_path**: Heuristic "good" optimization sequence + predicted score (MML-inspired efficiency)

## Dataset Details

- **Size**: 100 examples (v1 – expand in future versions)
- **Train/Val Split**: 90/10
- **Generation**: Rule-based synthetic (random shapes/dtypes/targets + simple heuristics for paths). Not from real traces yet.
- **Intended use**: Fine-tuning tiny models (e.g. [pot-o-pathfinder-tiny-v1](https://huggingface.co/Tribewarez/pot-o-pathfinder-tiny-v1)) to predict better tensor transformation paths for low-power PoT-O miners.

## Related: Ch7 (tensor dimensioning + networking)

[synthetic-pot-o-challenges-ch7-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-ch7-v1) adds challenges that prove tensor dimensioning and networking effects from the manuscript **Part IV — Information-Theoretic Foundation of Spacetime** (§3, §4, §7). See [CHALLENGE_FORMAT.md](https://github.com/TribeWarez/pot-o-ch7-cluster/blob/main/CHALLENGE_FORMAT.md) in [pot-o-ch7-cluster](https://github.com/TribeWarez/pot-o-ch7-cluster).

## Next Iterations

- Add real tensor traces from ai3-lib
- More diverse challenges
- Verified optimal paths via solvers
- 500+ examples with varied op combinations
- Create v2 with real matrix compression benchmarks

---

MIT licensed • Tribewarez guild • Live beta • 2026

## Link to Model

In your model README.yaml add:

```yaml
datasets:
  - Tribewarez/synthetic-pot-o-challenges-v1
```
