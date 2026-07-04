# OPS-03: Build an interactive visualization component

Interactive islands live in `src/components/viz/` as Preact + TypeScript components, used in MDX as `<Component client:load />` (or `client:visible` for below-the-fold).

## Rules
1. **Reuse first**: check `src/components/viz/` for an existing component (FunctionPlot, etc.) that can be parameterized before writing a new one.
2. Rendering tech by need:
   - 2D function/geometry with sliders → plain canvas 2D (like FunctionPlot) — zero deps, preferred.
   - Sketch-style / animation-loop heavy (unit circle, waves) → p5.js in instance mode, dynamically imported inside the island.
   - Statistical charts with hover/zoom (histograms, distributions) → plotly.js-dist-min, dynamically imported.
   - 3D → three.js, dynamically imported.
   Dynamic import keeps heavy libs out of the initial bundle: `const p5 = (await import('p5')).default` inside `useEffect`.
3. Component contract:
   - Props control the math (function, parameter ranges, initial values) so one component serves many concepts.
   - Labels/axes in English. Font: inherit page font. Respect `prefers-color-scheme` (read CSS variables, not hardcoded colors).
   - Responsive: canvas width fits container (max 100%), sensible fixed aspect ratio, redraws on resize.
   - Controls: native `<input type="range">` + numeric readout of the current value; keyboard accessible.
4. No global state, no window pollution; clean up (cancelAnimationFrame, p5.remove(), observers) on unmount.
5. Add a one-line usage example as a doc comment at the top of the component file.

## Verify
Build passes; open the page in `npm run preview`, drag every slider, resize the window, toggle OS dark mode.
