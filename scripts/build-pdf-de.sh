#!/usr/bin/env bash
# Build combined German manuscript and PDF with title page, TOC, and keyword index.
# Requires: pandoc, pdflatex (e.g. from TeX Live).
# Run from repo root: ./scripts/build-pdf-de.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MD="$REPO_ROOT/markdown/de"
DIST="$REPO_ROOT/dist"
COMBINED="$DIST/manuscript-combined-de.md"
PDF="$DIST/manuscript-de.pdf"

mkdir -p "$DIST"

# Combine: front matter + Part I (REALMS) + Part II (API) + Part III (Materialization) + Part IV (Information Spacetime) + Index
{
  cat "$MD/00-Titel-Vorwort-Inhalt.md"
  printf '\n\n'
  echo '# Teil I — Planck als Realm des aktuellen Beobachters'
  printf '\n\n'
  tail -n +2 "$MD/REALMS.md"
  printf '\n\n'
  echo '# Teil II — API-Manipulation und Wellenlängen–Wahrnehmungs-Hypothese'
  printf '\n\n'
  tail -n +2 "$MD/REALMS-API-Manipulation.md"
  printf '\n\n'
  echo '# Teil III — Materialisierungsthese'
  printf '\n\n'
  tail -n +2 "$MD/REALMS-Materialization-Thesis.md"
  printf '\n\n'
  echo '# Teil IV — Informations-theoretische Grundlage der Raumzeit'
  printf '\n\n'
  tail -n +2 "$MD/REALMS-Information-Spacetime.md"
  printf '\n\n'
  cat "$MD/99-Stichwortverzeichnis.md"
} > "$COMBINED"

# Build PDF with linked TOC, numbered sections, math via LaTeX
if ! pandoc "$COMBINED" -o "$PDF" \
  --toc \
  --toc-depth=3 \
  --number-sections \
  --pdf-engine=pdflatex; then
  echo ""
  echo "PDF-Build fehlgeschlagen. Bei 'pdflatex not found' TeX Live installieren:"
  echo "  sudo apt install texlive-latex-base texlive-fonts-recommended"
  echo "Für volle Math-/Unicode-Unterstützung: sudo apt install texlive-latex-extra"
  exit 1
fi

echo "Erstellt: $PDF (aus $COMBINED)"
