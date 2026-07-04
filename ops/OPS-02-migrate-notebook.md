# OPS-02: Migrate a V1 notebook into the catalog

Input: a notebook path under `lab/` (e.g., `lab/math/eulers_number.ipynb`). Output: one or more concept MDX pages.

## Steps
1. Read the whole notebook. Identify how many distinct concepts it contains (usually 1; split if clearly 2+).
2. Scaffold each page with `node scripts/new-concept.mjs <domain> <concept-id> "<title_ja>" "<title_en>"`.
3. **Narrative**: copy every markdown cell's text into the MDX body **verbatim** (Hard rule #1 in CLAUDE.md). Keep the original order and headings. Convert notebook-only syntax:
   - `attachment:image.png` images → extract from the .ipynb JSON (`cell.attachments`, base64) into `public/img/<concept-id>/NN.png` and reference with BASE_URL.
   - LaTeX stays as-is (KaTeX-compatible; flag anything KaTeX rejects).
4. **Code cells**: do NOT copy Python code into the page. For each plot-producing cell, choose:
   - a. Re-render as a static PNG: run the notebook cell (or equivalent script) and save to `public/img/<concept-id>/`, OR
   - b. Upgrade to an interactive island (OPS-03) if a slider/animation would clearly serve the concept better — the V1 cell's intent (e.g., FuncAnimation) is the signal.
   Record the choice per cell in the task report.
5. Frontmatter: set `source:` to the lab notebook path, `status: migrated`, best-guess `prerequisites`/`related` (flag uncertain ones).
6. Verify per `ops/definition-of-done.md`, including a verbatim-narrative spot check.

## Concept-id naming
kebab-case English, e.g. `eulers-number`, `central-limit-theorem`, `t-test`. One id is forever — do not rename existing ids.
