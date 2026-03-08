#!/usr/bin/env bash
# Install dependencies for Pandoc as listed in /usr/share/doc/pandoc/README.Debian
# Run on Debian/Ubuntu: sudo ./install-pandoc-deps.sh
# Use --recommended to install only what's needed for this repo's PDF build.

set -e

RECOMMENDED_ONLY=false
if [[ "${1:-}" == "--recommended" ]]; then
  RECOMMENDED_ONLY=true
fi

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run with sudo: sudo $0"
  exit 1
fi

echo "Updating package lists..."
apt-get update -qq

# --- Required for this manuscript's PDF (LaTeX + math) ---
RECOMMENDED="
  texlive-latex-recommended
  texlive-latex-extra
  texlive-fonts-recommended
"

if "$RECOMMENDED_ONLY"; then
  echo "Installing recommended set for PDF build (pdflatex + math)..."
  apt-get install -y $RECOMMENDED
  echo "Done. Run ./build-pdf.sh to build the manuscript."
  exit 0
fi

# --- Full set from README.Debian ---

# SVG in PDF
echo "Installing SVG/PDF support (librsvg2-bin)..."
apt-get install -y librsvg2-bin

# YAML in TeX, LaTeX/PDF, math
echo "Installing TeX Live (latex-recommended, latex-extra, fonts)..."
apt-get install -y texlive-latex-recommended texlive-latex-extra texlive-fonts-recommended

# Alternative PDF engines
echo "Installing XeLaTeX and LuaTeX..."
apt-get install -y texlive-xetex texlive-luatex || true

# ConTeXt (optional, often large)
echo "Installing ConTeXt (optional)..."
apt-get install -y context || true

# PDF via wkhtmltopdf
echo "Installing wkhtmltopdf..."
apt-get install -y wkhtmltopdf || true

# Roff/groff for man/ms
echo "Installing groff..."
apt-get install -y groff

# Math in HTML (MathJax / KaTeX)
echo "Installing MathJax..."
apt-get install -y libjs-mathjax || true
# node-katex may be npm; skip if not in apt
apt-get install -y node-katex 2>/dev/null || true

# Citation styles (optional)
apt-get install -y citation-style-language-styles 2>/dev/null || true

# Filter runtimes (so *.py, *.pl, etc. filters work if needed)
echo "Installing filter runtimes (python3, perl, nodejs recommended)..."
apt-get install -y python3 perl nodejs 2>/dev/null || true
# Optional: ghc, php, ruby, r-base-core
for pkg in ghc php ruby r-base-core; do
  apt-get install -y "$pkg" 2>/dev/null || true
done

echo "Done. Optional packages may have been skipped if not in your repositories."
echo "For just this manuscript's PDF, you can use: sudo $0 --recommended"
