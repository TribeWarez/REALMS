#!/bin/bash
# Export manuscript-OSJ-de.md to DOCX for Open Science Journal (German version).
# Requires: pandoc (https://pandoc.org/)
# Run from repo root: ./scripts/export-OSJ-docx-de.sh [reference.docx]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT="$REPO_ROOT/markdown/de/manuscript-OSJ-de.md"
OUTPUT="$REPO_ROOT/dist/manuscript-OSJ-de.docx"

if ! command -v pandoc &> /dev/null; then
  echo "Fehler: pandoc ist nicht installiert. Siehe https://pandoc.org/"
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Fehler: $INPUT nicht gefunden."
  exit 1
fi

mkdir -p "$REPO_ROOT/dist"

if [ -n "$1" ] && [ -f "$1" ]; then
  echo "Referenzdokument: $1"
  pandoc "$INPUT" -o "$OUTPUT" --reference-doc="$1"
else
  pandoc "$INPUT" -o "$OUTPUT"
fi

echo "Erstellt: $OUTPUT. In Word öffnen, Seitenzahlen und Einzeilig setzen."
