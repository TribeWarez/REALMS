#!/usr/bin/env bash
# Build standalone PDF for "Theoretische Grundlagen transmutativer Maschinensysteme".
# Requires: pandoc, pdflatex (e.g. from TeX Live).
# Run from repo root: ./scripts/build-pdf-theoretische.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT="$REPO_ROOT/markdown/de/Theoretische-Grundlagen.md"
DIST="$REPO_ROOT/dist"
PDF="$DIST/theoretische-grundlagen.pdf"

mkdir -p "$DIST"

if [ ! -f "$INPUT" ]; then
  echo "Error: $INPUT not found."
  exit 1
fi

if ! pandoc "$INPUT" -o "$PDF" \
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

echo "Built: $PDF"
