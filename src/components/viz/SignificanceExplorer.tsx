// Usage: <SignificanceExplorer client:load />
//
// Interactive replacement for the V1 matplotlib FuncAnimation
// (lab/stats/statistical_significance.ipynb). Simulates two groups
// (old drug vs. new drug) from normal distributions with a fixed seed,
// lets the user scrub sample size and true effect size, and shows the
// live Welch's t-test p-value against alpha = 0.05.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

const MAX_N = 200;
const MIN_N = 5;
const ALPHA = 0.05;
const OLD_MEAN = 5.0;
const STD_DEV = 2.0;
const SEED = 42; // mirrors np.random.seed(42) in the source notebook

// ---------------------------------------------------------------------------
// Seeded random normal generation (reproducible across renders/reloads)
// ---------------------------------------------------------------------------

// mulberry32: small, fast, deterministic PRNG (public domain).
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform: pairs of uniform draws -> standard normal z-scores.
function standardNormals(count: number, seed: number): number[] {
  const rand = mulberry32(seed);
  const out: number[] = [];
  while (out.length < count) {
    const u1 = Math.max(rand(), 1e-12);
    const u2 = rand();
    const mag = Math.sqrt(-2.0 * Math.log(u1));
    out.push(mag * Math.cos(2.0 * Math.PI * u2));
    if (out.length < count) out.push(mag * Math.sin(2.0 * Math.PI * u2));
  }
  return out.slice(0, count);
}

// ---------------------------------------------------------------------------
// Welch's t-test with a Student-t CDF via the regularized incomplete beta
// function (Numerical Recipes' betai/betacf). This is the same numerical
// route SciPy/most stats libraries use internally, evaluated here directly
// in TypeScript so the page has no runtime dependency on scipy/jStat.
// Accuracy: ~1e-8 relative error for the parameter ranges used here
// (df up to a few hundred, x in [0, 1]); more than sufficient for a
// pedagogical p-value readout.
// ---------------------------------------------------------------------------

function logGamma(x: number): number {
  // Lanczos approximation (g=7, n=9), standard coefficients.
  const g = 7;
  const coeffs = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7
  ];
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  x -= 1;
  let a = coeffs[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += coeffs[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

// Continued fraction for the incomplete beta function (Numerical Recipes betacf).
function betacf(x: number, a: number, b: number): number {
  const MAXIT = 200;
  const EPS = 3e-9;
  const FPMIN = 1e-300;

  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;

  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;

    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

// Regularized incomplete beta function I_x(a, b).
function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(logBeta(a, b) * -1 + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) {
    return (bt * betacf(x, a, b)) / a;
  }
  return 1 - (bt * betacf(1 - x, b, a)) / b;
}

// Two-tailed Student-t p-value for statistic t with df degrees of freedom.
function studentTTwoTailedP(t: number, df: number): number {
  const x = df / (df + t * t);
  const p = incompleteBeta(x, df / 2, 0.5);
  return Math.min(1, Math.max(0, p));
}

interface WelchResult {
  t: number;
  df: number;
  p: number;
}

function welchTTest(a: number[], b: number[]): WelchResult {
  const n1 = a.length;
  const n2 = b.length;
  const mean1 = a.reduce((s, v) => s + v, 0) / n1;
  const mean2 = b.reduce((s, v) => s + v, 0) / n2;
  const var1 = a.reduce((s, v) => s + (v - mean1) ** 2, 0) / (n1 - 1);
  const var2 = b.reduce((s, v) => s + (v - mean2) ** 2, 0) / (n2 - 1);

  const se2 = var1 / n1 + var2 / n2;
  const t = (mean1 - mean2) / Math.sqrt(se2);
  const df =
    (se2 * se2) /
    ((var1 / n1) ** 2 / (n1 - 1) + (var2 / n2) ** 2 / (n2 - 1));
  const p = studentTTwoTailedP(Math.abs(t), df);
  return { t, df, p };
}

interface Props {
  minN?: number;
  maxN?: number;
  initialN?: number;
  initialEffectSize?: number;
}

export default function SignificanceExplorer({
  minN = MIN_N,
  maxN = MAX_N,
  initialN = 20,
  initialEffectSize = 0.5
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);
  const [n, setN] = useState(initialN);
  const [effectSize, setEffectSize] = useState(initialEffectSize);

  // Fixed z-scores, drawn once with a fixed seed, reused for every n /
  // effect-size combination so the underlying sample never "rerolls" -
  // only the mean shift (effect size) and the slice length (n) change.
  const zOld = useMemo(() => standardNormals(maxN, SEED), [maxN]);
  const zNew = useMemo(() => standardNormals(maxN, SEED + 1), [maxN]);

  const oldData = useMemo(() => zOld.map((z) => OLD_MEAN + z * STD_DEV), [zOld]);
  const newData = useMemo(
    () => zNew.map((z) => OLD_MEAN + effectSize + z * STD_DEV),
    [zNew, effectSize]
  );

  // p-value trend across all sample sizes for the current effect size,
  // used for the lower "p-value vs sample size" panel.
  const pTrend = useMemo(() => {
    const sizes: number[] = [];
    const values: number[] = [];
    for (let size = minN; size <= maxN; size++) {
      sizes.push(size);
      values.push(welchTTest(oldData.slice(0, size), newData.slice(0, size)).p);
    }
    return { sizes, values };
  }, [oldData, newData, minN, maxN]);

  const current = useMemo(
    () => welchTTest(oldData.slice(0, n), newData.slice(0, n)),
    [oldData, newData, n]
  );

  const isSignificant = current.p < ALPHA;

  function buildFigure() {
    const container = containerRef.current;
    const style = container ? getComputedStyle(container) : null;
    const cssVar = (name: string, fallback: string) =>
      (style?.getPropertyValue(name).trim() || fallback);
    const fg = cssVar("--sig-fg", "#1f2428");
    const grid = cssVar("--sig-grid", "#d8dee4");
    const bg = cssVar("--sig-bg", "#ffffff");
    const oldColor = cssVar("--sig-old", "#4682b4");
    const newColor = cssVar("--sig-new", "#dc143c");
    const sigColor = cssVar("--sig-line", "#8b008b");

    const slicedOld = oldData.slice(0, n);
    const slicedNew = newData.slice(0, n);
    const meanOld = slicedOld.reduce((s, v) => s + v, 0) / slicedOld.length;
    const meanNew = slicedNew.reduce((s, v) => s + v, 0) / slicedNew.length;

    const histTraces = [
      {
        x: slicedOld,
        type: "histogram",
        name: `Old Drug (n=${n})`,
        opacity: 0.6,
        marker: { color: oldColor },
        xbins: { start: -2, end: 12, size: 0.5 }
      },
      {
        x: slicedNew,
        type: "histogram",
        name: `New Drug (n=${n})`,
        opacity: 0.6,
        marker: { color: newColor },
        xbins: { start: -2, end: 12, size: 0.5 }
      }
    ];

    const trendTrace = {
      x: pTrend.sizes,
      y: pTrend.values,
      type: "scatter",
      mode: "lines+markers",
      name: "p-value",
      marker: { size: 4, color: sigColor },
      line: { color: sigColor },
      xaxis: "x2",
      yaxis: "y2"
    };

    const data = [
      ...histTraces,
      trendTrace,
      // marker for the currently-selected n on the trend panel
      {
        x: [n],
        y: [current.p],
        type: "scatter",
        mode: "markers",
        name: "current n",
        marker: { size: 10, color: isSignificant ? "#1a9850" : "#444", line: { width: 1, color: fg } },
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false
      }
    ];

    const layout = {
      barmode: "overlay",
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fg, family: "system-ui, sans-serif" },
      margin: { t: 40, b: 50, l: 55, r: 20 },
      grid: { rows: 2, columns: 1, pattern: "independent" },
      showlegend: true,
      legend: { orientation: "h", y: 1.15 },
      xaxis: { title: { text: "Effect Value" }, gridcolor: grid, range: [-2, 12] },
      yaxis: { title: { text: "Count" }, gridcolor: grid, domain: [0.55, 1] },
      xaxis2: { title: { text: "Sample Size" }, gridcolor: grid, range: [minN, maxN] },
      yaxis2: { title: { text: "p-value" }, gridcolor: grid, range: [0, 1], domain: [0, 0.4] },
      shapes: [
        // alpha = 0.05 threshold line
        {
          type: "line",
          xref: "x2",
          yref: "y2",
          x0: minN,
          x1: maxN,
          y0: ALPHA,
          y1: ALPHA,
          line: { color: "#e04040", width: 2, dash: "dash" }
        },
        // shaded "significant" region below alpha
        {
          type: "rect",
          xref: "x2",
          yref: "y2",
          x0: minN,
          x1: maxN,
          y0: 0,
          y1: ALPHA,
          fillcolor: "#e04040",
          opacity: 0.1,
          line: { width: 0 }
        },
        // dashed mean markers on the histogram panel (paper-relative y so
        // the line spans the panel regardless of the histogram's y-range)
        {
          type: "line",
          xref: "x",
          yref: "paper",
          x0: meanOld,
          x1: meanOld,
          y0: 0.55,
          y1: 1,
          line: { color: oldColor, width: 2, dash: "dash" }
        },
        {
          type: "line",
          xref: "x",
          yref: "paper",
          x0: meanNew,
          x1: meanNew,
          y0: 0.55,
          y1: 1,
          line: { color: newColor, width: 2, dash: "dash" }
        }
      ],
      annotations: [
        {
          xref: "x2",
          yref: "y2",
          x: maxN,
          y: ALPHA,
          xanchor: "right",
          yanchor: "bottom",
          text: "alpha = 0.05",
          showarrow: false,
          font: { color: "#e04040", size: 11 }
        }
      ]
    };

    return { data, layout };
  }

  // Mount effect: dynamically import Plotly once, draw the initial figure,
  // and purge on unmount only (never on every slider tick).
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

  // Update effect: on every slider change, diff-update the existing plot
  // via Plotly.react (no purge/remount) once Plotly has finished loading.
  useEffect(() => {
    if (!plotlyRef.current || !containerRef.current) return;
    const { data, layout } = buildFigure();
    plotlyRef.current.react(containerRef.current, data, layout, {
      responsive: true,
      displayModeBar: false
    });
  }, [oldData, newData, n, pTrend, minN, maxN, current.p, isSignificant]);

  return (
    <section class="significance-explorer" aria-label="Interactive statistical significance explorer">
      <style>
        {`
          .significance-explorer {
            --sig-bg: #ffffff;
            --sig-grid: #e3e7ea;
            --sig-fg: #1f2428;
            --sig-old: #4682b4;
            --sig-new: #dc143c;
            --sig-line: #8b008b;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }

          @media (prefers-color-scheme: dark) {
            .significance-explorer {
              --sig-bg: #1d2022;
              --sig-grid: #343a40;
              --sig-fg: #eef1f2;
              --sig-old: #7fb2dc;
              --sig-new: #ff6b81;
              --sig-line: #d18ce8;
            }
          }

          .significance-explorer .plot-area {
            width: 100%;
            min-height: 480px;
          }

          .significance-explorer .controls {
            display: grid;
            gap: 12px;
          }

          .significance-explorer .control-row {
            display: grid;
            grid-template-columns: minmax(140px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .significance-explorer .control-row input {
            width: 100%;
          }

          .significance-explorer .readout {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 24px;
            align-items: baseline;
            font: 600 1rem system-ui, sans-serif;
            color: var(--fg, #1f2428);
          }

          .significance-explorer .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 700;
          }

          .significance-explorer .badge.significant {
            background: #1a9850;
            color: #fff;
          }

          .significance-explorer .badge.not-significant {
            background: var(--muted, #647079);
            color: #fff;
          }

          @media (max-width: 520px) {
            .significance-explorer .control-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div class="controls">
        <label class="control-row">
          <span>Sample size n = {n}</span>
          <input
            type="range"
            min={minN}
            max={maxN}
            step={1}
            value={n}
            onInput={(event) => setN(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
        <label class="control-row">
          <span>True effect size = {effectSize.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={effectSize}
            onInput={(event) =>
              setEffectSize(Number((event.currentTarget as HTMLInputElement).value))
            }
          />
        </label>
      </div>

      <div class="readout">
        <span>t = {current.t.toFixed(3)}</span>
        <span>df = {current.df.toFixed(1)}</span>
        <span>p = {current.p.toFixed(4)}</span>
        <span class={`badge ${isSignificant ? "significant" : "not-significant"}`}>
          {isSignificant ? "Significant (p < 0.05)" : "Not significant (p ≥ 0.05)"}
        </span>
      </div>

      <div class="plot-area" ref={containerRef} />
    </section>
  );
}
