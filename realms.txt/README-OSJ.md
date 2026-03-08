# Open Science Journal (OSJ) submission checklist

This document supports submission of **manuscript-OSJ.md** to the [Open Science Journal](https://osjournal.org/submissions.html). Ensure every requirement below is met before submitting (including after converting to DOCX).

## Style and format

- [ ] **File format:** Manuscript in DOC, DOCX, or RTF. Microsoft Word documents must not be locked or protected. Use `export-OSJ-docx.sh` or Pandoc (see below), then open in Word and save as DOCX without protection.
- [ ] **Length:** No restrictions; present findings concisely.
- [ ] **Font:** Use any standard font and standard font size in the final DOCX.
- [ ] **Headings:** Maximum 3 heading levels. Heading levels clearly indicated in the manuscript (Level 1: main sections; Level 2: subsections; Level 3: sub-subsections). Already enforced in manuscript-OSJ.md.
- [ ] **Layout:** Single-spaced. Do not use multiple columns. Set in Word (Paragraph → Line spacing: Single) before submission.
- [ ] **Page numbers:** Include page numbers in the manuscript file. Add in Word before submission.
- [ ] **Footnotes:** Not permitted. Any footnote content must be moved into the main text or the reference list. (Manuscript-OSJ.md contains no footnotes.)
- [ ] **Language:** Manuscripts must be submitted in English (exemptions for specific fields such as arts and humanities).
- [ ] **Abbreviations:** Define each abbreviation on first appearance in the text. Do not use non-standard abbreviations unless they appear at least three times. Keep abbreviations to a minimum. (API, EEG, CKN, ER = EPR are defined on first use in manuscript-OSJ.md.)
- [ ] **Reference style:** Vancouver (citation-sequence): references numbered in order of first appearance; cite in text as [1], [2], etc.; list at end; first six authors then “et al.”
- [ ] **Equations:** Use MathType or Equation Editor for display and inline equations in the final DOCX where possible. Do not use MathType/Equation Editor for single variables, Greek symbols, or operators in running text—use normal text with correct Unicode where possible. Avoid hybrid equations (part text, part MathType). (Pandoc output may need manual conversion to MathType/Equation Editor.)

## Manuscript organization

**Beginning (required order):**

- [ ] **Title page (first page):** Full title (250–350 characters), short title (50–100 characters), author names (first name or initials, middle name or initials, last name), affiliations (department, institution, city, state/province if applicable, country) for each author, corresponding author and email address.
- [ ] **Abstract:** Immediately after title page. 250–350 words. Describe main objective(s); how the study was done (without full methodological detail); most important results and significance. No citations. No abbreviations if possible. (Abstract in manuscript-OSJ.md is within word count and has no citations; API is spelled out on first use.)
- [ ] **Introduction:** Background and context; problem and importance; brief key literature; relevant controversies; overall aim and whether that aim was achieved. (Manuscript-OSJ.md includes a closing sentence on aim achieved.)

**Middle (can be renamed/reordered):**

- [ ] **Materials and Methods** (or equivalent: “Theoretical framework” in manuscript-OSJ.md): Enough detail for replication; definitions and notation included.
- [ ] **Results:** Findings; tables and figure citations in ascending order. Each table placed immediately after the paragraph that first cites it; each figure caption placed immediately after the paragraph that first cites the figure.
- [ ] **Discussion:** Interpretation, implications, relation to previous work, limitations. Avoid overstating conclusions.
- [ ] **Conclusions (optional):** Summarise conclusions; may be combined with Discussion.

**Ending (required order):**

- [ ] **Acknowledgments:** Those who contributed but do not meet authorship criteria; description of contribution. (Manuscript-OSJ.md: “None.”)
- [ ] **References:** Listed at end, numbered in order of appearance in text. Vancouver format. Only cite published or accepted manuscripts, or pre-prints if submitted and publicly available. Do not cite unpublished work or “data not shown” in the reference list; use supplementary material or a repository instead. No personal communications in the reference list.
- [ ] **Supporting Information captions (if applicable):** At end of manuscript. File number and name required; one-line title recommended. (Manuscript-OSJ.md includes S1 Appendix caption with file number, name, and title.)

## Figures and tables

- [ ] **Figures:** Do not include figures in the main manuscript file. Upload each figure as a separate file. Cite figures in ascending numeric order (Fig 1, Fig 2, …). Figure captions must be inserted in the manuscript text immediately after the paragraph in which the figure is first cited. Caption must include: figure label with Arabic numerals, “Figure” abbreviated to “Fig” (e.g. Fig 1, Fig 2); concise descriptive title; legend if needed. Match the figure file name to the citation (e.g. Fig 1 → upload as Fig1.tif or similar). (Manuscript-OSJ.md: Fig 1 is cited in the Summary diagram paragraph and caption follows; figure file to be uploaded separately.)
- [ ] **Tables:** Cite tables in ascending order. Place each table in the manuscript directly after the paragraph in which it is first cited. Table label (e.g. Table 1) and brief descriptive title above the table. Legends, footnotes, and other text below the table. Do not submit tables as separate files. (Manuscript-OSJ.md: Table 1, Table 2, Table 3 are each cited in the preceding paragraph and placed immediately after.)

## Supporting information

- [ ] Supporting information files: optional; subject to peer review; max 10 MB per file. Use names containing “S” and number (e.g. S1 Appendix, S2 Table). Supporting Information captions listed at end of manuscript with file number, name, and (recommended) one-line title.

## Final steps before submission

1. **Export to DOCX**  
   From the repo root: `./export-OSJ-docx.sh` (or, with a custom reference doc: `./export-OSJ-docx.sh reference.docx`).  
   Output: `manuscript-OSJ.docx`.

2. **In Word**  
   Open `manuscript-OSJ.docx` and before submission:
   - Set **single spacing**: Layout / Paragraph → Line spacing: Single (or equivalent).
   - Add **page numbers** (e.g. Insert → Page Number).
   - Use a **standard font and size** (e.g. 12 pt Times New Roman or as per OSJ).
   - Ensure the file is **not protected/locked**: Review → Restrict Editing should be off; save as DOCX without password or protection.
   - **Complete**: author names, affiliations (department, institution, city, state/province, country), corresponding author and email; verify and complete the **reference list** (journal, volume, pages, DOI where applicable).

3. **Fig 1**  
   - **Caption**: Already in the manuscript text after the first citation; leave it there.  
   - **File**: Prepare the observer-realm diagram (e.g. export from Mermaid or redraw in a drawing tool). Upload it as a **separate file** at submission, named to match the citation (e.g. `Fig1.tif` or `Fig1.png`). Do not embed this file in the main DOCX.

For the German version, run `de/export-OSJ-docx.sh` from the repo root (or from `de/`), use `de/manuscript-OSJ-de.md` as source; apply the same Word and figure steps to `manuscript-OSJ-de.docx` and upload "Abb. 1" as a separate file.

## Data reporting

- [ ] If applicable: deposit data and metadata in an appropriate public repository; provide DOIs or accession numbers; ensure at least CC BY openness where required. provide DOIs or accession numbers; ensure at least CC BY openness where required.

## Pandoc: generate DOCX from Markdown

From the directory containing `manuscript-OSJ.md`, run `./export-OSJ-docx.sh` (see **Final steps before submission** above). If `reference-osj.docx` is present in the same directory, the script uses it for styling (e.g. single spacing, standard font); you can still add page numbers and complete author/references in Word. To use a different reference document: `./export-OSJ-docx.sh reference.docx`.

Raw Pandoc commands:

```bash
pandoc manuscript-OSJ.md -o manuscript-OSJ.docx
```

Optional: use a reference DOCX for styling (e.g. `reference-osj.docx` or an OSJ template if provided by the journal):

```bash
pandoc manuscript-OSJ.md -o manuscript-OSJ.docx --reference-doc=reference.docx
```

Then open `manuscript-OSJ.docx` in Word and: (1) ensure the document is not locked or protected; (2) add page numbers; (3) set single spacing (Paragraph → Line spacing: Single); (4) use standard font and size; (5) convert display equations to MathType or Equation Editor if required; (6) complete author names, affiliations, and corresponding author email; (7) verify and complete the reference list.

## German version (deutsche Fassung)

A German OSJ-submittable version is in **de/manuscript-OSJ-de.md**, with **de/README-OSJ-de.md** (checklist and Pandoc instructions) and **de/export-OSJ-docx.sh** to generate `manuscript-OSJ-de.docx`. OSJ primarily accepts English; check journal guidelines if submitting the German manuscript.
