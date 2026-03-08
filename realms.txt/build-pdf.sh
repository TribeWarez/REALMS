#!/usr/bin/env bash
# Build combined manuscript and PDF with title page, TOC, and keyword index.
# Requires: pandoc, pdflatex (e.g. from TeX Live).
# Run from the directory containing this script (realms.txt/).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMBINED="manuscript-combined.md"
PDF="manuscript.pdf"

# Combine: front matter + Part I (REALMS) + Part II (API) + Part III (Materialization) + Part IV (Information Spacetime) + Index
{
  cat "00-Title-Preface-TOC.md"
  printf '\n\n'
  echo '# Part I — Planck as the Realm of the Current Observer'
  printf '\n\n'
  tail -n +2 "REALMS.md"
  printf '\n\n'
  echo '# Part II — API Manipulation and Wavelength–Perception Hypothesis'
  printf '\n\n'
  tail -n +2 "REALMS-API-Manipulation.md"
  printf '\n\n'
  echo '# Part III — Materialization Thesis'
  printf '\n\n'
  tail -n +2 "REALMS-Materialization-Thesis.md"
  printf '\n\n'
  echo '# Part IV — Information-Theoretic Foundation of Spacetime'
  printf '\n\n'
  tail -n +2 "REALMS-Information-Spacetime.md"
  printf '\n\n'
  cat "99-Keyword-Index.md"
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
