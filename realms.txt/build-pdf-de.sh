#!/usr/bin/env bash
# Build combined German manuscript and PDF with title page, TOC, and keyword index.
# Requires: pandoc, pdflatex (e.g. from TeX Live).
# Run from the directory containing this script (realms.txt/).

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

COMBINED="de/manuscript-combined.md"
PDF="de/manuscript.pdf"

# Combine: front matter + Part I (REALMS) + Part II (API) + Part III (Materialization) + Part IV (Information Spacetime) + Index
{
  cat "de/00-Titel-Vorwort-Inhalt.md"
  printf '\n\n'
  echo '# Teil I — Planck als Realm des aktuellen Beobachters'
  printf '\n\n'
  tail -n +2 "de/REALMS.md"
  printf '\n\n'
  echo '# Teil II — API-Manipulation und Wellenlängen–Wahrnehmungs-Hypothese'
  printf '\n\n'
  tail -n +2 "de/REALMS-API-Manipulation.md"
  printf '\n\n'
  echo '# Teil III — Materialisierungsthese'
  printf '\n\n'
  tail -n +2 "de/REALMS-Materialization-Thesis.md"
  printf '\n\n'
  echo '# Teil IV — Informations-theoretische Grundlage der Raumzeit'
  printf '\n\n'
  tail -n +2 "de/REALMS-Information-Spacetime.md"
  printf '\n\n'
  cat "de/99-Stichwortverzeichnis.md"
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
