// Usage: <PowerCurveExplorer client:load />
//
// Interactive replacement for the V1 matplotlib FuncAnimation
// (lab/stats/statistical_power.ipynb, saved as lab/stats/statistical_power.gif):
// for each per-group sample size n, simulate n_simulations independent
// two-sample t-tests (effect_size=0.2, alpha=0.05, mirroring the notebook's
// simulate_p_values()) and show the resulting p-value histogram alongside
// the theoretical power curve, with a marker for the current n.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { mulberry32, welchTTest } from "./statmath";

const EFFECT_SIZE = 0.2;
const ALPHA = 0.05;
const N_SIMULATIONS = 500;
const MIN_N = 10;
const MAX_N = 100;
const STEP_N = 5;
const SEED = 42; // mirrors np.random.seed(42) in the source notebook

function sampleSizes(): number[] {
  const out: number[] = [];
  for (let n = MIN_N; n <= MAX_N; n += STEP_N) out.push(n);
  return out;
}

// Deterministic standard-normal draws via Box-Muller, seeded per call so the
// same (n, simulation index) always reproduces the same pair of samples.
function normalPair(rand: () => number, mean1: number, mean2: number, count: number) {
  const g1: number[] = [];
  const g2: number[] = [];
  while (g1.length < count) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const mag = Math.sqrt(-2 * Math.log(u1));
    g1.push(mean1 + mag * Math.cos(2 * Math.PI * u2));
    if (g1.length < count) g1.push(mean1 + mag * Math.sin(2 * Math.PI * u2));
  }
  while (g2.length < count) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const mag = Math.sqrt(-2 * Math.log(u1));
    g2.push(mean2 + mag * Math.cos(2 * Math.PI * u2));
    if (g2.length < count) g2.push(mean2 + mag * Math.sin(2 * Math.PI * u2));
  }
  return [g1.slice(0, count), g2.slice(0, count)] as const;
}

function simulatePValues(n: number, seedOffset: number): number[] {
  const rand = mulberry32(SEED + seedOffset);
  const pValues: number[] = [];
  for (let i = 0; i < N_SIMULATIONS; i++) {
    const [group1, group2] = normalPair(rand, 0, EFFECT_SIZE, n);
    pValues.push(welchTTest(group1, group2).p);
  }
  return pValues;
}

// Theoretical power for a two-sided two-sample t-test via a normal
// approximation to the noncentral-t (accurate enough for this pedagogical
// curve; matches statsmodels' TTestIndPower closely for these n/effect
// ranges).
function approxPower(n: number, effectSize: number, alpha: number): number {
  const ncp = effectSize * Math.sqrt(n / 2);
  const zAlpha = 1.959963984540054; // z for alpha/2 = 0.025, two-sided
  const cdf = (z: number) => 0.5 * (1 + erf(z / Math.SQRT2));
  return 1 - cdf(zAlpha - ncp) + cdf(-zAlpha - ncp);
}

function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const ax = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * ax);
  const y = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-ax * ax);
  return sign * y;
}

const HIST_BIN_COUNT = 20;

export default function PowerCurveExplorer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);
  const sizes = useMemo(sampleSizes, []);
  const [n, setN] = useState(20);

  const powerCurve = useMemo(
    () => sizes.map((size) => approxPower(size, EFFECT_SIZE, ALPHA)),
    [sizes]
  );

  const pValues = useMemo(() => simulatePValues(n, sizes.indexOf(n)), [n, sizes]);
  const simulatedPower = useMemo(
    () => pValues.filter((p) => p < ALPHA).length / pValues.length,
    [pValues]
  );

  function buildFigure() {
    const container = containerRef.current;
    const style = container ? getComputedStyle(container) : null;
    const cssVar = (name: string, fallback: string) =>
      style?.getPropertyValue(name).trim() || fallback;
    const fg = cssVar("--pc-fg", "#1f2428");
    const grid = cssVar("--pc-grid", "#d8dee4");
    const bg = cssVar("--pc-bg", "#ffffff");
    const histColor = cssVar("--pc-hist", "#4682b4");
    const curveColor = cssVar("--pc-curve", "#dc143c");

    const histTrace = {
      x: pValues,
      type: "histogram",
      name: "p-value distribution",
      marker: { color: histColor },
      xbins: { start: 0, end: 1, size: 1 / HIST_BIN_COUNT },
      xaxis: "x",
      yaxis: "y"
    };

    const curveTrace = {
      x: sizes,
      y: powerCurve,
      type: "scatter",
      mode: "lines",
      name: "Power curve",
      line: { color: curveColor, width: 2 },
      xaxis: "x2",
      yaxis: "y2"
    };

    const markerTrace = {
      x: [n],
      y: [approxPower(n, EFFECT_SIZE, ALPHA)],
      type: "scatter",
      mode: "markers",
      name: "current n",
      marker: { size: 10, color: "#e08a00" },
      xaxis: "x2",
      yaxis: "y2",
      showlegend: false
    };

    const data = [histTrace, curveTrace, markerTrace];

    const layout = {
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fg, family: "system-ui, sans-serif" },
      margin: { t: 40, b: 50, l: 55, r: 20 },
      grid: { rows: 1, columns: 2, pattern: "independent" },
      showlegend: false,
      xaxis: { title: { text: "p-value" }, gridcolor: grid, range: [0, 1], domain: [0, 0.46] },
      yaxis: { title: { text: `Frequency (n=${n} per group)` }, gridcolor: grid },
      xaxis2: {
        title: { text: "Sample size (per group)" },
        gridcolor: grid,
        range: [MIN_N, MAX_N],
        domain: [0.54, 1]
      },
      yaxis2: { title: { text: "Power (1-beta)" }, gridcolor: grid, range: [0, 1] },
      shapes: [
        {
          type: "line",
          xref: "x2",
          yref: "y2",
          x0: n,
          x1: n,
          y0: 0,
          y1: 1,
          line: { color: "#e08a00", width: 1.5, dash: "dash" }
        }
      ]
    };

    return { data, layout };
  }

  useEffect(() => {
    let disposed = false;
    (async () => {
      const Plotly = (await import("plotly.js-dist-min")).default;
      if (disposed || !containerRef.current) return;
      plotlyRef.current = Plotly;
      const { data, layout } = buildFigure();
      await Plotly.react(containerRef.current, data, layout, {
        responsive: true,
        displayModeBar: false
      });
    })();
    return () => {
      disposed = true;
      if (containerRef.current && plotlyRef.current) {
        plotlyRef.current.purge(containerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!plotlyRef.current || !containerRef.current) return;
    const { data, layout } = buildFigure();
    plotlyRef.current.react(containerRef.current, data, layout, {
      responsive: true,
      displayModeBar: false
    });
  }, [n, pValues, powerCurve]);

  return (
    <section class="power-curve-explorer" aria-label="Interactive statistical power explorer">
      <style>
        {`
          .power-curve-explorer {
            --pc-bg: #ffffff;
            --pc-grid: #e3e7ea;
            --pc-fg: #1f2428;
            --pc-hist: #4682b4;
            --pc-curve: #dc143c;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }

          @media (prefers-color-scheme: dark) {
            .power-curve-explorer {
              --pc-bg: #1d2022;
              --pc-grid: #343a40;
              --pc-fg: #eef1f2;
              --pc-hist: #7fb2dc;
              --pc-curve: #ff6b81;
            }
          }

          .power-curve-explorer .plot-area {
            width: 100%;
            min-height: 380px;
          }

          .power-curve-explorer .control-row {
            display: grid;
            grid-template-columns: minmax(170px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .power-curve-explorer .control-row input {
            width: 100%;
          }

          .power-curve-explorer .readout {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 24px;
            align-items: baseline;
            font: 600 1rem system-ui, sans-serif;
            color: var(--fg, #1f2428);
          }

          @media (max-width: 520px) {
            .power-curve-explorer .control-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <label class="control-row">
        <span>Sample size (n per group) = {n}</span>
        <input
          type="range"
          min={MIN_N}
          max={MAX_N}
          step={STEP_N}
          value={n}
          onInput={(event) => setN(Number((event.currentTarget as HTMLInputElement).value))}
        />
      </label>

      <div class="readout">
        <span>Simulated power = {simulatedPower.toFixed(2)}</span>
        <span>Theoretical power = {approxPower(n, EFFECT_SIZE, ALPHA).toFixed(2)}</span>
        <span>alpha = {ALPHA}</span>
        <span>effect size = {EFFECT_SIZE}</span>
      </div>

      <div class="plot-area" ref={containerRef} />
    </section>
  );
}
