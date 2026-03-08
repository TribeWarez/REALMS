# GitHub Actions

Workflows for [pot-o-ch7-cluster](https://github.com/TribeWarez/pot-o-ch7-cluster). Submodules are not required for CI or Docker build.

- **CI** (`ci.yml`): On push/PR to main/master — run Ch7 unit tests, validate Ch7 shard JSONL, run cluster generator (dry). One job runs the same tests inside a `python:3.11-slim` container.
- **Docker** (`docker.yml`): Build `realms-devkit` image from `realms-devkit/Dockerfile`; run Ch7 tests and cluster generator in container. On push to main/master or tag `v*`, push image to GitHub Container Registry as `ghcr.io/<owner>/realms-devkit:latest` and `ghcr.io/<owner>/realms-devkit:<sha>`.

## Running in container

Pull and run the published image (after workflow has run):

```bash
docker pull ghcr.io/tribewarez/realms-devkit:latest
docker run -p 8888:8888 -v $(pwd):/workspace ghcr.io/tribewarez/realms-devkit:latest
```

Or build locally and run the cluster generator with the repo mounted:

```bash
docker build -t realms-devkit ./realms-devkit
docker run --rm -v "$(pwd)":/workspace -w /workspace realms-devkit \
  python generate_synthetic_pot_o_challenges_ch7_cluster.py --total 1024 --workers 1 --worker-id 0 --output-dir ./out
```
