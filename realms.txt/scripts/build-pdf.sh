#!/usr/bin/env bash
# Build combined manuscript and PDF with title page, TOC, and keyword index.
# Requires: pandoc, pdflatex (e.g. from TeX Live).
# Run from repo root: ./scripts/build-pdf.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MD="$REPO_ROOT/markdown"
DIST="$REPO_ROOT/dist"
COMBINED="$DIST/manuscript-combined.md"
PDF="$DIST/manuscript.pdf"

mkdir -p "$DIST"

# Combine: front matter + Part I (REALMS) + Part II (API) + Part III (Materialization) + Part IV (Information Spacetime) + Index
{
  cat "$MD/00-Title-Preface-TOC.md"
  printf '\n\n'
  echo '# Part I — Planck as the Realm of the Current Observer'
  printf '\n\n'
  tail -n +2 "$MD/REALMS.md"
  printf '\n\n'
  echo '# Part II — API Manipulation and Wavelength–Perception Hypothesis'
  printf '\n\n'
  tail -n +2 "$MD/REALMS-API-Manipulation.md"
  printf '\n\n'
  echo '# Part III — Materialization Thesis'
  printf '\n\n'
  tail -n +2 "$MD/REALMS-Materialization-Thesis.md"
  printf '\n\n'
  echo '# Part IV — Information-Theoretic Foundation of Spacetime'
  printf '\n\n'
  tail -n +2 "$MD/REALMS-Information-Spacetime.md"
  printf '\n\n'
  cat "$MD/99-Keyword-Index.md"
} > "$COMBINED"

# Build PDF with linked TOC, numbered sections, math via LaTeX
# On Debian/Ubuntu, pdflatex is provided by texlive (not a package named "pdflatex"):
#   sudo apt install texlive-latex-base texlive-fonts-recommended
# For full math/unicode: sudo apt install texlive-latex-extra texlive-fonts-recommended
if ! pandoc "$COMBINED" -o "$PDF" \
  --toc \
  --toc-depth=3 \
  --number-sections \
  --pdf-engine=pdflatex; then
  echo ""
  echo "PDF build failed. If the error was 'pdflatex not found', install TeX Live:"
  echo "  sudo apt install texlive-latex-base texlive-fonts-recommended"
  echo "For full math support: sudo apt install texlive-latex-extra"
  exit 1
fi

echo "Built: $PDF (from $COMBINED)"
