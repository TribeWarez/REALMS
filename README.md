# REALMS

[![License: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](LICENSE)
[![Build and release](https://github.com/TribeWarez/realms/actions/workflows/build-release.yml/badge.svg)](https://github.com/TribeWarez/realms/actions/workflows/build-release.yml)

**REALMS** (Realm-based Emergent Architecture for Localized Manifestation Spaces) is a theoretical physics manuscript exploring an operational framework that links the Planck scale, the observer as receiver/emitter of information, consciousness as a translation layer (API), and an information-theoretic foundation of spacetime.

Developed bilingually (English / German). Builds to PDF and DOCX for open-access journal submission (e.g. Open Science Journal).

> **Other languages:** [Deutsch](README_DE.md) · [日本語](README_JA.md)

---

## Repository layout

| Path | Contents |
|------|----------|
| `markdown/` | Manuscript source (Markdown). English: Parts I–IV, preface, TOC, keyword index, OSJ variant, OSJ checklist. |
| `markdown/de/` | German translations — mirrors English structure. |
| `scripts/` | Build and export shell scripts. Run from **repository root**. |
| `dist/` | Build output — PDFs and DOCX files (committed). |
| `assets/` | Cover artwork and images. |
| `.github/workflows/` | CI: `build-release.yml` — builds all artifacts on tag push (`v*`). |

---

## Requirements

- **PDF build:** [pandoc](https://pandoc.org/) + [TeX Live](https://www.tug.org/texlive/) (`pdflatex`).  
  Debian/Ubuntu: `sudo ./scripts/install-pandoc-deps.sh --recommended`
- **DOCX export:** pandoc only.

---

## Build commands

```bash
./scripts/build-pdf.sh              # → dist/manuscript.pdf (English)
./scripts/build-pdf-de.sh           # → dist/manuscript-de.pdf (German)
./scripts/export-OSJ-docx.sh        # → dist/manuscript-OSJ.docx (English, OSJ format)
./scripts/export-OSJ-docx-de.sh     # → dist/manuscript-OSJ-de.docx (German, OSJ format)
```

All scripts require `bash` (WSL / Git Bash on Windows). Run from the repository root.

---

## Manuscript structure

- **Part I** — Planck as the realm of the current observer: definitions, postulates, proof/refutation scope. (`markdown/REALMS.md`)
- **Part II** — API manipulation and wavelength–perception hypothesis. (`markdown/REALMS-API-Manipulation.md`)
- **Part III** — Materialization thesis: perceptual materialization, photon storage, quantum interference. (`markdown/REALMS-Materialization-Thesis.md`)
- **Part IV** — Information-theoretic foundation of spacetime: tensor networks, entanglement–geometry, emergent gravity, Standard Model emergence. (`markdown/REALMS-Information-Spacetime.md`)

The combined manuscript (preface + Parts I–IV + keyword index) is assembled by `build-pdf.sh`.  
`markdown/manuscript-OSJ.md` is a flattened variant (≤3 heading levels, no footnotes, Vancouver references) for OSJ submission — see `markdown/README-OSJ.md`.

---

## Companion devkit

Experimental tooling for Part IV (tensor networks, Qiskit circuits, quimb) lives in a separate repository:

**[TribeWarez/pot-o-ch7-cluster](https://github.com/TribeWarez/pot-o-ch7-cluster)** — Docker + Jupyter + Qiskit + synthetic challenge generators.

---

## License

This work is licensed under [Creative Commons Attribution 4.0 International](LICENSE) (CC BY 4.0).  
Copyright © 2026 TribeWarez.
