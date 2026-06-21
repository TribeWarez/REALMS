#!/usr/bin/env bash
# Build combined Japanese manuscript and PDF.
# Requires: pandoc, pdflatex (e.g. from TeX Live).
# Run from repo root: ./scripts/build-pdf-ja.sh
# Note: Japanese source files (markdown/ja/) must exist before this will succeed.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MD="$REPO_ROOT/markdown/ja"
DIST="$REPO_ROOT/dist"
COMBINED="$DIST/manuscript-combined-ja.md"
PDF="$DIST/manuscript-ja.pdf"

mkdir -p "$DIST"

if [ ! -f "$MD/00-Titel-Vorwort-Inhalt.md" ] && [ ! -f "$MD/00-Title-Preface-TOC.md" ]; then
  echo "Warning: No Japanese source files found in $MD. Skipping build."
  echo "Create markdown/ja/ with translated manuscript parts to enable this build."
  exit 0
fi

# Combine: front matter + Part I + II + III + IV + Index
{
  if [ -f "$MD/00-Titel-Vorwort-Inhalt.md" ]; then
    cat "$MD/00-Titel-Vorwort-Inhalt.md"
  elif [ -f "$MD/00-Title-Preface-TOC.md" ]; then
    cat "$MD/00-Title-Preface-TOC.md"
  fi
  printf '\n\n'
  echo '# パートI — 現在の観測者の領域としてのプランク'
  printf '\n\n'
  [ -f "$MD/REALMS.md" ] && tail -n +2 "$MD/REALMS.md"
  printf '\n\n'
  echo '# パートII — API操作と波長–知覚仮説'
  printf '\n\n'
  [ -f "$MD/REALMS-API-Manipulation.md" ] && tail -n +2 "$MD/REALMS-API-Manipulation.md"
  printf '\n\n'
  echo '# パートIII — 物質化テーゼ'
  printf '\n\n'
  [ -f "$MD/REALMS-Materialization-Thesis.md" ] && tail -n +2 "$MD/REALMS-Materialization-Thesis.md"
  printf '\n\n'
  echo '# パートIV — 時空の情報理論的基盤'
  printf '\n\n'
  [ -f "$MD/REALMS-Information-Spacetime.md" ] && tail -n +2 "$MD/REALMS-Information-Spacetime.md"
  printf '\n\n'
  [ -f "$MD/99-Keyword-Index.md" ] && cat "$MD/99-Keyword-Index.md"
  [ -f "$MD/99-Stichwortverzeichnis.md" ] && cat "$MD/99-Stichwortverzeichnis.md"
} > "$COMBINED"

if ! pandoc "$COMBINED" -o "$PDF" \
  --toc \
  --toc-depth=3 \
  --number-sections \
  --pdf-engine=pdflatex; then
  echo ""
  echo "PDF build failed."
  exit 1
fi

echo "Built: $PDF (from $COMBINED)"
