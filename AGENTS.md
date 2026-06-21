# AGENTS.md — REALMS

This is a **theoretical physics manuscript repository**, not a software project. The manuscript explores Planck-scale observer theory, consciousness as an API translation layer, and information-theoretic spacetime.

## Build

All scripts require `bash` (WSL/Git Bash on Windows). Output lands in `dist/`.

```bash
./scripts/build-pdf.sh              # English PDF → dist/manuscript.pdf
./scripts/build-pdf-de.sh           # German PDF  → dist/manuscript-de.pdf
./scripts/export-OSJ-docx.sh        # English DOCX (OSJ journal format)
./scripts/export-OSJ-docx-de.sh     # German DOCX
./scripts/install-pandoc-deps.sh    # Debian/Ubuntu: install pandoc + TeX Live
```

Prerequisites: `pandoc`, `pdflatex` (TeX Live). No package.json, no lockfiles, no linter/formatter config.

## Source structure

- **Canonical source** is `markdown/*.md` (Parts I–IV), not PDFs or `realms.txt/`.
- **German translations** mirror English: `markdown/de/` has parallel structure.
- **OSJ variant** (`manuscript-OSJ.md`) is a flattened version with ≤3 heading levels, no footnotes, no TOC, Vancouver references.
- **Build concatenates**: preface + Part I + Part II + Part III + Part IV + keyword index → single pandoc run.

## Important constraints

- **No `.gitignore`** — `dist/` PDFs and DOCX are committed. Do not add one unless asked.
- **No tests, no CI** beyond tag-push release builds (`.github/workflows/build-release.yml`). No linter, typecheck, or test commands.
- **`osji-version/`** is empty (placeholder). Do not populate it.
- **Companion devkit** lives at `github.com/TribeWarez/pot-o-ch7-cluster` (Docker + Jupyter + Qiskit). Not in this repo.
- **AI co-authors** are credited in the manuscript. This is intentional.
- **`LICENSE`** is CC-BY 4.0 (Creative Commons Attribution 4.0 International) — standard for open-access academic text, not MIT.
- **Multilingual READMEs**: `README.md` (EN), `README_DE.md` (DE), `README_JA.md` (JP). Keep all three in sync when updating.

## Verifying changes

Visually inspect rendered PDF or DOCX. There is no automated verification.
