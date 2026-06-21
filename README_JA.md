# REALMS

[![ライセンス: CC BY 4.0](https://img.shields.io/badge/License-CC_BY_4.0-lightgrey.svg)](LICENSE)
[![ビルドとリリース](https://github.com/TribeWarez/realms/actions/workflows/build-release.yml/badge.svg)](https://github.com/TribeWarez/realms/actions/workflows/build-release.yml)

**REALMS**（Realm-based Emergent Architecture for Localized Manifestation Spaces）は、プランクスケール、情報の受信者・送信者としての観測者、翻訳層（API）としての意識、そして時空の情報理論的基盤を結びつける操作的枠組みを探求する理論物理学草稿です。

英語・ドイツ語のバイリンガルで開発。オープンアクセスジャーナル（例：Open Science Journal）への投稿用にPDFおよびDOCXを生成します。

> **他の言語:** [English](README.md) · [Deutsch](README_DE.md)

---

## リポジトリ構成

| パス | 内容 |
|------|------|
| `markdown/` | 草稿ソース（Markdown）。英語：パートI～IV、序文、目次、キーワード索引、OSJ版、OSJチェックリスト。 |
| `markdown/de/` | ドイツ語翻訳 — 英語版をミラー。 |
| `scripts/` | ビルドおよびエクスポート用シェルスクリプト。**リポジトリルート**から実行。 |
| `dist/` | ビルド出力 — PDFおよびDOCX（コミット済み）。 |
| `assets/` | 表紙アートワークおよび画像。 |
| `.github/workflows/` | CI: `build-release.yml` — タグプッシュ（`v*`）ですべてのアーティファクトをビルド。 |

---

## 必要条件

- **PDFビルド:** [pandoc](https://pandoc.org/) + [TeX Live](https://www.tug.org/texlive/)（`pdflatex`）。  
  Debian/Ubuntu: `sudo ./scripts/install-pandoc-deps.sh --recommended`
- **DOCXエクスポート:** pandocのみ。

---

## ビルドコマンド

```bash
./scripts/build-pdf.sh              # → dist/manuscript.pdf（英語）
./scripts/build-pdf-de.sh           # → dist/manuscript-de.pdf（ドイツ語）
./scripts/export-OSJ-docx.sh        # → dist/manuscript-OSJ.docx（英語、OSJ形式）
./scripts/export-OSJ-docx-de.sh     # → dist/manuscript-OSJ-de.docx（ドイツ語、OSJ形式）
```

すべてのスクリプトは`bash`（WSL / Git Bash on Windows）が必要です。リポジトリルートから実行してください。

---

## 草稿構成

- **パートI** — 現在の観測者の領域としてのプランク：定義、公準、証明・反証の余地。（`markdown/REALMS.md`）
- **パートII** — API操作と波長・知覚仮説。（`markdown/REALMS-API-Manipulation.md`）
- **パートIII** — 物質化テーゼ：知覚的物質化、光子貯蔵、量子干渉。（`markdown/REALMS-Materialization-Thesis.md`）
- **パートIV** — 時空の情報理論的基盤：テンソルネットワーク、絡み合い幾何学、創発的重力、標準模型の出現。（`markdown/REALMS-Information-Spacetime.md`）

結合草稿（序文＋パートI～IV＋キーワード索引）は`build-pdf.sh`がアセンブルします。  
`markdown/manuscript-OSJ.md`はOSJ投稿用に平坦化された版（見出しレベル≤3、脚注なし、Vancouver形式参考文献）です。詳細は`markdown/README-OSJ.md`を参照。

---

## コンパニオンデブキット

パートIV（テンソルネットワーク、Qiskit回路、quimb）の実験的ツールは別リポジトリにあります：

**[TribeWarez/pot-o-ch7-cluster](https://github.com/TribeWarez/pot-o-ch7-cluster)** — Docker + Jupyter + Qiskit + 合成チャレンジ生成器。

---

## ライセンス

この作品は[クリエイティブ・コモンズ 表示 4.0 国際](LICENSE)（CC BY 4.0）の下でライセンスされています。  
Copyright © 2026 TribeWarez.
