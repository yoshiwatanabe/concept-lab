# concept-lab

Personal concept catalog for learning math / stats / ML / physics / electricity.
Each concept = one MDX page with Japanese narrative, LaTeX math, and interactive/animated visualization.
Static Astro site deployed to GitHub Pages at https://yoshiwatanabe.github.io/concept-lab/.

## Commands
- `npm run dev` — local dev server
- `npm run build` — production build + pagefind search index (must pass before any task is "done")
- `npm run preview` — preview the built site

## Architecture
- `src/content/concepts/<domain>/<concept-id>.mdx` — one file per concept; frontmatter schema enforced by the content collection (see `src/content.config.ts`). Domains: math, stats, ml, physics, electricity, language.
- `src/components/viz/` — reusable Preact interactive islands (canvas/p5/Plotly/three). Reuse before writing new ones.
- `lab/` — Jupyter notebooks (the exploration lab; migrated V1 assets live here untouched).
- `manim/` — Manim CE scene sources; rendered videos are committed to `public/video/`.
- `ops/` — operational instructions. **Before doing any task, read the OPS doc it references and `ops/definition-of-done.md`.**

## Hard rules
1. **Preserve the user's Japanese narrative verbatim** when migrating notebook content. The text reflects his personal understanding — do not paraphrase, "improve", or translate it. Fixing an obvious typo is allowed only if noted in the task report.
2. Chart/axis/UI labels inside visualizations are **English**; narrative text is Japanese.
3. All internal links and asset URLs must respect the base path — use `import.meta.env.BASE_URL`, never hardcode `/concept-lab/` or root-absolute paths. BASE_URL has NO trailing slash here: always write `${import.meta.env.BASE_URL}/img/...` (with the explicit `/`), never `${import.meta.env.BASE_URL}img/...`.
4. Math is written as LaTeX in MDX (`$...$` / `$$...$$`), rendered by KaTeX. Verify rendering in the build output.
5. Every concept declares `prerequisites` and `related` in frontmatter. If unsure, leave your best guess and flag it in the task report — the orchestrator curates the graph.
6. Do not commit. Stage with `git add -A` and stop; the orchestrator reviews and commits.
7. Keep components dependency-light. Adding an npm package requires justification in the task report.
