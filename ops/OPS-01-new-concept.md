# OPS-01: Create a new concept entry

Use when adding a brand-new concept (not migrating a notebook — that's OPS-02).

## Steps
1. Run the scaffolder:
   ```
   node scripts/new-concept.mjs <domain> <concept-id> "<title_ja>" "<title_en>"
   ```
   This creates `src/content/concepts/<domain>/<concept-id>.mdx` from the template with `status: stub`.
2. Fill frontmatter: `level` (1–5 depth within domain), `prerequisites` (concept ids that should be understood first), `related`, `viz` (which tiers this page will use).
3. Write the body in this order:
   - **導入 (intro)**: 2–4 sentences in Japanese — what the concept is and why it matters, in plain words.
   - **直感 (intuition)**: the geometric/visual mental model, referencing the visualization.
   - Visualization(s): interactive island (OPS-03) and/or Manim video (OPS-04) and/or static image in `public/img/<concept-id>/`.
   - **式 (formalism)**: the LaTeX math, introduced only after the intuition.
   - **つながり (connections)**: 1–3 sentences linking to prerequisite/related concepts.
4. Set `status`: `draft` (narrative done, viz pending) or `migrated`/`polished` per ops/definition-of-done.md.
5. Verify per `ops/definition-of-done.md`.

## Notes
- Narrative voice: first-person learning notes in Japanese ("〜だと分かった", "〜と考えると納得できる"), NOT textbook voice. Match the tone of existing pages.
- One concept per page. If the draft covers two ideas, split and cross-link via `related`.
