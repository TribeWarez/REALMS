# REALMS

[![Lizenz: CC BY 4.0](https://img.shields.io/badge/Lizenz-CC_BY_4.0-lightgrey.svg)](LICENSE)
[![Build und Release](https://github.com/TribeWarez/realms/actions/workflows/build-release.yml/badge.svg)](https://github.com/TribeWarez/realms/actions/workflows/build-release.yml)

**REALMS** (Realm-based Emergent Architecture for Localized Manifestation Spaces) ist ein theoretisch-physikalisches Manuskript, das einen operationalen Rahmen entwickelt: die Planck-Skala, den Beobachter als Empfänger/Sender von Information, Bewusstsein als Übersetzungsschicht (API) und eine informationstheoretische Fundierung von Raumzeit.

Zweisprachig entwickelt (Englisch / Deutsch). Erzeugt PDF und DOCX zur Einreichung bei Open-Access-Journalen (z. B. Open Science Journal).

> **Weitere Sprachen:** [English](README.md) · [日本語](README_JA.md)

---

## Repository-Struktur

| Pfad | Inhalt |
|------|--------|
| `markdown/` | Manuskriptquellen (Markdown). Englisch: Teile I–IV, Vorwort, Inhaltsverzeichnis, Schlagwortindex, OSJ-Variante, OSJ-Checkliste. |
| `markdown/de/` | Deutsche Übersetzungen — spiegelt die englische Struktur. |
| `scripts/` | Build- und Export-Shellskripte. Ausführung **vom Repository-Root** aus. |
| `dist/` | Build-Ausgabe — PDFs und DOCX (eingecheckt). |
| `agents/` | Agent-Hub-Registrierung und MOTHUB-Protokoll. |
| `assets/` | Titelbild und Grafiken. |
| `.github/workflows/` | CI: `build-release.yml` — baut alle Artefakte bei Tag-Push (`v*`). |

---

## Voraussetzungen

- **PDF-Build:** [pandoc](https://pandoc.org/) + [TeX Live](https://www.tug.org/texlive/) (`pdflatex`).  
  Debian/Ubuntu: `sudo ./scripts/install-pandoc-deps.sh --recommended`
- **DOCX-Export:** nur pandoc.

---

## Build-Befehle

```bash
./scripts/build-pdf.sh              # → dist/manuscript.pdf (Englisch)
./scripts/build-pdf-de.sh           # → dist/manuscript-de.pdf (Deutsch)
./scripts/build-pdf-ja.sh           # → dist/manuscript-ja.pdf (Japanisch)
./scripts/build-pdf-theoretische.sh # → dist/theoretische-grundlagen.pdf
./scripts/export-OSJ-docx.sh        # → dist/manuscript-OSJ.docx (Englisch, OSJ-Format)
./scripts/export-OSJ-docx-de.sh     # → dist/manuscript-OSJ-de.docx (Deutsch, OSJ-Format)
```

Alle Skripte benötigen `bash` (WSL / Git Bash unter Windows). Ausführung vom Repository-Root aus.

---

## Manuskriptstruktur

- **Teil I** — Planck als Reich des aktuellen Beobachters: Definitionen, Postulate, Beweis-/Widerlegbarkeitsspielraum. (`markdown/REALMS.md`)
- **Teil II** — API-Manipulation und Wellenlängen-Wahrnehmungs-Hypothese. (`markdown/REALMS-API-Manipulation.md`)
- **Teil III** — Materialisierungsthese: perzeptuelle Materialisierung, Photonenspeicher, Quanteninterferenz. (`markdown/REALMS-Materialization-Thesis.md`)
- **Teil IV** — Informationstheoretische Fundierung der Raumzeit: Tensornetzwerke, Verschränkungsgeometrie, emergente Gravitation, Standardmodell-Entstehung. (`markdown/REALMS-Information-Spacetime.md`)

Das kombinierte Manuskript (Vorwort + Teile I–IV + Schlagwortindex) wird von `build-pdf-de.sh` assembliert.  
`markdown/manuscript-OSJ.md` ist eine abgeflachte Variante (≤3 Überschriftsebenen, keine Fußnoten, Vancouver-Referenzen) für die OSJ-Einreichung — siehe `markdown/de/README-OSJ-de.md`.

---

## Begleit-Devkit

Experimentelle Werkzeuge für Teil IV (Tensornetzwerke, Qiskit-Schaltkreise, quimb) befinden sich in einem separaten Repository:

**[TribeWarez/pot-o-ch7-cluster](https://github.com/TribeWarez/pot-o-ch7-cluster)** — Docker + Jupyter + Qiskit + synthetische Challenge-Generatoren.

### Hugging Face

- **Collection:** [`Tribewarez/pot-o-pathfinder-tiny`](https://huggingface.co/collections/Tribewarez/pot-o-pathfinder-tiny) — Übersicht aller Modelle, Datensätze und Spaces
- **Modell:** [`Tribewarez/pot-o-pathfinder-tiny-v1`](https://huggingface.co/Tribewarez/pot-o-pathfinder-tiny-v1) — Tensor-Pathfinder für PoT-O-Challenge-Validierung
- **Datensatz:** [`Tribewarez/synthetic-pot-o-challenges-ch7-v1`](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-ch7-v1) — synthetische Challenges für Kapitel 7
- **Datensatz:** [`Tribewarez/synthetic-pot-o-challenges-v1`](https://huggingface.co/datasets/Tribewarez/synthetic-pot-o-challenges-v1) — vollständiger synthetischer Challenge-Korpus

### FreeFi

FreeFi (Freedom Finance) Komponenten bilden die DeFi-Schicht des TribeWarez-Stacks — erlaubnisfreie tensor-gestützte Liquiditätspools, Proof-of-Tensor-Mining-Belohnungen und Cross-Chain-Bridge-Primitive. Integrationsbeispiele und Testnet-Deployment sind im Companion-Devkit-Repository verfügbar.

---

## Agenten-Ökosystem

| Endpunkt | Zweck |
|----------|-------|
| [`realms.tribewarez.com`](https://realms.tribewarez.com) | Live-Lattice-Map — Echtzeit-Visualisierung der Energieknoten |
| [`realms.tribewarez.com/agent-hub.html`](https://realms.tribewarez.com/agent-hub.html) | Dezentrales Agenten-Register und Node-Discovery |
| [`realms.tribewarez.com/agent-signup.html`](https://realms.tribewarez.com/agent-signup.html) | KI-Agenten-Registrierung mit Capability-Profil |

Siehe [`agents/MOTHUB.md`](agents/MOTHUB.md) für das vollständige Protokoll.

---

## Lizenz

Dieses Werk ist lizenziert unter der [Creative Commons Attribution 4.0 International Lizenz](LICENSE) (CC BY 4.0).  
Copyright © 2026 TribeWarez.
