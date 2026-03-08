# REALMS

Operational framework linking the Planck scale, the observer as receiver/emitter of information, consciousness as a translation layer (API), and an information-theoretic foundation of spacetime. The manuscript is developed in English and German and can be built to PDF or DOCX for submission (e.g. Open Science Journal).

## Repository layout

| Folder / file | Contents |
|---------------|----------|
| **markdown/** | Manuscript source (Markdown). English: `REALMS.md`, `manuscript-OSJ.md`, `manuscript-combined.md`, front matter, Part II–IV, keyword index; OSJ checklist: `README-OSJ.md`. |
| **markdown/de/** | German sources: `REALMS.md`, `manuscript-OSJ-de.md`, `manuscript-combined.md`, etc.; `README-OSJ-de.md` for OSJ submission. |
| **scripts/** | Build and export scripts. Run from **repository root**. |
| **dist/** | Build output: PDFs, DOCX (e.g. `manuscript.pdf`, `manuscript-OSJ.docx`, `manuscript-de.pdf`). |

## Requirements

- **PDF build:** [pandoc](https://pandoc.org/), [TeX Live](https://www.tug.org/texlive/) (e.g. `pdflatex`). On Debian/Ubuntu: `sudo apt install pandoc texlive-latex-base texlive-fonts-recommended` (for full math: `texlive-latex-extra`). Optional: `sudo ./scripts/install-pandoc-deps.sh --recommended`.
- **DOCX export:** pandoc only.

## Build commands (run from repo root)

- **English PDF** (combined manuscript with TOC, from `markdown/`):  
  `./scripts/build-pdf.sh`  
  → `dist/manuscript-combined.md`, `dist/manuscript.pdf`

- **German PDF:**  
  `./scripts/build-pdf-de.sh`  
  → `dist/manuscript-combined-de.md`, `dist/manuscript-de.pdf`

- **English DOCX** (OSJ submission):  
  `./scripts/export-OSJ-docx.sh`  
  → `dist/manuscript-OSJ.docx`  
  Optional: place `reference-osj.docx` in `scripts/` for styling (single spacing, font). Override: `./scripts/export-OSJ-docx.sh path/to/reference.docx`.

- **German DOCX** (OSJ):  
  `./scripts/export-OSJ-docx-de.sh`  
  → `dist/manuscript-OSJ-de.docx`

## Manuscript structure (English)

- **Part I:** Planck as the realm of the current observer — definitions, postulates, proof/refutation scope (`markdown/REALMS.md`).
- **Part II:** API manipulation and wavelength–perception hypothesis (`markdown/REALMS-API-Manipulation.md`).
- **Part III:** Materialization thesis (`markdown/REALMS-Materialization-Thesis.md`).
- **Part IV:** Information-theoretic foundation of spacetime — tensor networks, entanglement–geometry, emergent gravity (`markdown/REALMS-Information-Spacetime.md`).

The combined manuscript (title, preface, TOC, Parts I–IV, keyword index) is assembled by `build-pdf.sh`. The OSJ-ready version is `markdown/manuscript-OSJ.md`; see `markdown/README-OSJ.md` for submission checklist and final steps in Word.

## Part IV experiments, testing & toolkits

The **realms-devkit** (Docker, Jupyter, Qiskit, quimb), PoT-O Chapter 7 synthetic challenge generators, and related **testing libraries** live in a separate repository:

**[TribeWarez/pot-o-ch7-cluster](https://github.com/TribeWarez/pot-o-ch7-cluster)**

That repo provides:

- **realms-devkit** — Dockerized Python + Qiskit + quimb for Part IV (tensor networks, entanglement–geometry, information Lagrangian); Jupyter notebooks (Planck/bounds, tensor entropy, entanglement–geometry, Qiskit circuits).
- **PoT-O Ch7 cluster generator** — Synthetic challenges for tensor dimensioning and networking effects from Part IV §3, §4, §7; stdlib-only hot path for Raspberry Pi / ESP32 workers; optional push to Hugging Face.
- **Tests** — Unit tests for Ch7 format and generators (`python -m tests.test_pot_o_ch7 -v`).
- **Hugging Face** — Datasets: [synthetic-pot-o-challenges-ch7-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-ch7-v1), [synthetic-pot-o-challenges-v1](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-v1); model: [pot-o-pathfinder-tiny-v1](https://huggingface.co/Tribewarez/pot-o-pathfinder-tiny-v1).
- **CI / hosting** — Docker image (`ghcr.io/tribewarez/realms-devkit`), Binder, GitHub Codespaces, optional GitHub Pages.

Quick start with the devkit (from that repo):

```bash
git clone https://github.com/TribeWarez/pot-o-ch7-cluster.git
cd pot-o-ch7-cluster
docker build -t realms-devkit ./realms-devkit
docker run -p 8888:8888 -v $(pwd):/workspace realms-devkit
```

## License and submission

Manuscript and code are as provided by the authors. For Open Science Journal submission, follow the checklist in `markdown/README-OSJ.md` (and `markdown/de/README-OSJ-de.md` for the German version).
