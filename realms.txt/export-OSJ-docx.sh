#!/bin/bash
# Export manuscript-OSJ.md to DOCX for Open Science Journal submission.
# Requires: pandoc (https://pandoc.org/)
# Usage: ./export-OSJ-docx.sh [reference.docx]
# If no argument is given and reference-osj.docx exists in this directory, it is used for styling.

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
INPUT="manuscript-OSJ.md"
OUTPUT="manuscript-OSJ.docx"
REF_DEFAULT="$SCRIPT_DIR/reference-osj.docx"

if ! command -v pandoc &> /dev/null; then
  echo "Error: pandoc is not installed. Install from https://pandoc.org/"
  exit 1
fi

if [ ! -f "$INPUT" ]; then
  echo "Error: $INPUT not found."
  exit 1
fi

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
