# Definition of Done (all tasks)

A task in this repo is done only when ALL of these hold:

1. `npm run build` exits 0 with no warnings introduced by your change.
2. The affected page(s) render correctly in the built output:
   - KaTeX math renders (no raw `$...$` visible; `katex` classes present in dist HTML).
   - Interactive islands mount and respond (verify in `npm run preview` if possible; otherwise confirm the component compiles and its `client:` directive is present).
   - Images/videos resolve under the `/concept-lab/` base path.
3. Frontmatter validates against the content collection schema (build fails if not — see 1).
4. Japanese narrative text is verbatim from the source notebook (for migrations). Spot-check yourself: diff a few sentences.
5. No hardcoded absolute URLs; `import.meta.env.BASE_URL` used for internal refs.
6. Changes staged (`git add -A`), NOT committed.
7. Task report written (final message): files created/changed, deviations from spec, anything flagged for orchestrator review (uncertain prerequisites, typo fixes, new dependencies).
