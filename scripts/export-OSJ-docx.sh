#!/bin/bash
# Export manuscript-OSJ.md to DOCX for Open Science Journal submission.
# Requires: pandoc (https://pandoc.org/)
# Usage: ./scripts/export-OSJ-docx.sh [reference.docx]   (run from repo root)
# If no argument is given and reference-osj.docx exists in scripts/, it is used for styling.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
INPUT="$REPO_ROOT/markdown/manuscript-OSJ.md"
OUTPUT="$REPO_ROOT/dist/manuscript-OSJ.docx"
REF_DEFAULT="$SCRIPT_DIR/reference-osj.docx"

if ! command -v pandoc &> /dev/null; then
  echo "Error: pandoc is not installed. Install from https://pandoc.org/"
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Error: $INPUT not found."
  exit 1
fi

mkdir -p "$REPO_ROOT/dist"

if [ -n "$1" ] && [ -f "$1" ]; then
  echo "Using reference document: $1"
  pandoc "$INPUT" -o "$OUTPUT" --reference-doc="$1"
elif [ -f "$REF_DEFAULT" ]; then
  echo "Using reference document: reference-osj.docx"
  pandoc "$INPUT" -o "$OUTPUT" --reference-doc="$REF_DEFAULT"
else
  pandoc "$INPUT" -o "$OUTPUT"
fi

echo "Created $OUTPUT. Open in Word to add page numbers and set single spacing."
