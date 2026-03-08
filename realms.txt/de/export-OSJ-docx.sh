#!/bin/bash
# Export manuscript-OSJ-de.md nach DOCX für Open Science Journal (deutsche Fassung).
# Voraussetzung: pandoc (https://pandoc.org/)
# Aufruf: ./export-OSJ-docx.sh [reference.docx]

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
INPUT="manuscript-OSJ-de.md"
OUTPUT="manuscript-OSJ-de.docx"

if ! command -v pandoc &> /dev/null; then
  echo "Fehler: pandoc ist nicht installiert. Siehe https://pandoc.org/"
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Fehler: $INPUT nicht gefunden."
  exit 1
fi

if [ -n "$1" ] && [ -f "$1" ]; then
  echo "Referenzdokument: $1"
  pandoc "$INPUT" -o "$OUTPUT" --reference-doc="$1"
else
  pandoc "$INPUT" -o "$OUTPUT"
fi

echo "Erstellt: $OUTPUT. In Word öffnen, Seitenzahlen und Einzeilig setzen."
