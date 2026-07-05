// Usage: <CLTSampler client:load />
//
// Flagship replacement for the V1 p5.js central limit theorem simulator
// (lab/interactive-v1/central_limit_theorem.html). The V1 tool only sampled from a
// uniform[0,1] population via a run/clear button pair. This version adds a choice of
// three population shapes (uniform, exponential, bimodal) and a continuous sample-size
// slider that live-updates two stacked panels: the raw population shape (top, fixed per
// population) and a histogram of sample means for the current sample size n (bottom),
// with the theoretical N(mu, sigma^2/n) curve overlaid. All randomness is seeded so the
// figure is reproducible across renders/reloads.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

const MIN_N = 1;
const MAX_N = 50;
const TRIALS = 2000; // independent sample-mean draws used to build the bottom histogram
const POP_DRAWS = 4000; // raw draws used to depict the population shape on top

type PopulationKind = "uniform" | "exponential" | "bimodal";

const POPULATIONS: { id: PopulationKind; label: string; range: [number, number] }[] = [
  { id: "uniform", label: "Uniform[0,1]", range: [0, 1] },
  { id: "exponential", label: "Exponential(rate=1)", range: [0, 6] },
  { id: "bimodal", label: "Bimodal (two humps)", range: [0, 1] }
];

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

// Box-Muller: one standard normal draw per call (consumes two uniforms; simple over efficient).
function standardNormal(rand: () => number): number {
  const u1 = Math.max(rand(), 1e-12);
  const u2 = rand();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function rawDraw(kind: PopulationKind, rand: () => number): number {
  if (kind === "uniform") return rand();
  if (kind === "exponential") return -Math.log(1 - rand());
  // bimodal: 50/50 mixture of two tight normals at 0.3 and 0.7
  const center = rand() < 0.5 ? 0.3 : 0.7;
  return center + standardNormal(rand) * 0.05;
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function variance(values: number[], m: number): number {
  return values.reduce((s, v) => s + (v - m) ** 2, 0) / values.length;
}

function histogram(values: number[], range: [number, number], binCount: number) {
  const [lo, hi] = range;
  const width = (hi - lo) / binCount;
  const counts = new Array(binCount).fill(0);
  for (const v of values) {
    const idx = Math.min(binCount - 1, Math.max(0, Math.floor((v - lo) / width)));
    counts[idx]++;
  }
  const centers = Array.from({ length: binCount }, (_, i) => lo + (i + 0.5) * width);
  return { centers, counts, width };
}

export default function CLTSampler() {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);
  const [population, setPopulation] = useState<PopulationKind>("uniform");
  const [n, setN] = useState(5);

  const popMeta = POPULATIONS.find((p) => p.id === population)!;

  // Raw population draws: fixed per population choice (doesn't depend on n).
  const populationDraws = useMemo(() => {
    const rand = mulberry32(1000 + population.length);
    return Array.from({ length: POP_DRAWS }, () => rawDraw(population, rand));
  }, [population]);

  const popMean = useMemo(() => mean(populationDraws), [populationDraws]);
  const popVar = useMemo(() => variance(populationDraws, popMean), [populationDraws, popMean]);

  // Sample means: TRIALS independent draws of n values each, averaged.
  const sampleMeans = useMemo(() => {
    const rand = mulberry32(5000 + population.length * 97 + n);
    const out: number[] = new Array(TRIALS);
    for (let t = 0; t < TRIALS; t++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += rawDraw(population, rand);
      out[t] = sum / n;
    }
    return out;
  }, [population, n]);

  const sampleMeanAvg = useMemo(() => mean(sampleMeans), [sampleMeans]);
  const sampleMeanStd = useMemo(
    () => Math.sqrt(variance(sampleMeans, sampleMeanAvg)),
    [sampleMeans, sampleMeanAvg]
  );
  const theoreticalStd = Math.sqrt(popVar / n);

  function buildFigure() {
    const container = containerRef.current;
    const style = container ? getComputedStyle(container) : null;
    const cssVar = (name: string, fallback: string) => style?.getPropertyValue(name).trim() || fallback;
    const fg = cssVar("--clt-fg", "#1f2428");
    const grid = cssVar("--clt-grid", "#d8dee4");
    const bg = cssVar("--clt-bg", "#ffffff");
    const popColor = cssVar("--clt-pop", "#647079");
    const meanColor = cssVar("--clt-mean", "#4682b4");
    const curveColor = cssVar("--clt-curve", "#dc143c");

    const [lo, hi] = popMeta.range;
    const popHist = histogram(populationDraws, [lo, hi], 40);
    const meanHist = histogram(sampleMeans, [lo, hi], 40);

    const popTrace = {
      x: popHist.centers,
      y: popHist.counts,
      type: "bar",
      name: "Population",
      marker: { color: popColor },
      width: popHist.width * 0.95,
      xaxis: "x",
      yaxis: "y"
    };

    const meanTrace = {
      x: meanHist.centers,
      y: meanHist.counts,
      type: "bar",
      name: `Sample means (n=${n})`,
      marker: { color: meanColor },
      width: meanHist.width * 0.95,
      xaxis: "x2",
      yaxis: "y2"
    };

    // theoretical N(popMean, popVar/n) curve, scaled to the histogram's bin area
    const curveXs: number[] = [];
    const curveYs: number[] = [];
    const peakDensity = 1 / (theoreticalStd * Math.sqrt(2 * Math.PI));
    const scale = (TRIALS * meanHist.width) / 1; // counts-per-bin scale for a density curve
    for (let i = 0; i <= 100; i++) {
      const x = lo + ((hi - lo) * i) / 100;
      const z = theoreticalStd > 1e-9 ? (x - popMean) / theoreticalStd : 0;
      const density = theoreticalStd > 1e-9 ? peakDensity * Math.exp(-0.5 * z * z) : 0;
      curveXs.push(x);
      curveYs.push(density * scale);
    }
    const curveTrace = {
      x: curveXs,
      y: curveYs,
      type: "scatter",
      mode: "lines",
      name: "Theoretical N(mu, sigma^2/n)",
      line: { color: curveColor, width: 2.5 },
      xaxis: "x2",
      yaxis: "y2"
    };

    const layout = {
      barmode: "overlay",
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fg, family: "system-ui, sans-serif" },
      margin: { t: 40, b: 50, l: 55, r: 20 },
      grid: { rows: 2, columns: 1, pattern: "independent" },
      showlegend: true,
      legend: { orientation: "h", y: 1.12 },
      xaxis: { title: { text: `Population (${popMeta.label})` }, gridcolor: grid, range: [lo, hi] },
      yaxis: { title: { text: "Count" }, gridcolor: grid, domain: [0.58, 1] },
      xaxis2: { title: { text: "Sample mean" }, gridcolor: grid, range: [lo, hi] },
      yaxis2: { title: { text: "Count" }, gridcolor: grid, domain: [0, 0.42] }
    };

    return { data: [popTrace, meanTrace, curveTrace], layout };
  }

  useEffect(() => {
    let disposed = false;
    (async () => {
      const Plotly = (await import("plotly.js-dist-min")).default;
      if (disposed || !containerRef.current) return;
      plotlyRef.current = Plotly;
      const { data, layout } = buildFigure();
      await Plotly.react(containerRef.current, data, layout, { responsive: true, displayModeBar: false });
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
    plotlyRef.current.react(containerRef.current, data, layout, { responsive: true, displayModeBar: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [population, n, populationDraws, sampleMeans]);

  return (
    <section class="clt-sampler" aria-label="Interactive central limit theorem sampler">
      <style>
        {`
          .clt-sampler {
            --clt-bg: #ffffff;
            --clt-grid: #e3e7ea;
            --clt-fg: #1f2428;
            --clt-pop: #8a97a0;
            --clt-mean: #4682b4;
            --clt-curve: #dc143c;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }
          @media (prefers-color-scheme: dark) {
            .clt-sampler {
              --clt-bg: #1d2022;
              --clt-grid: #343a40;
              --clt-fg: #eef1f2;
              --clt-pop: #9aa5ab;
              --clt-mean: #7fb2dc;
              --clt-curve: #ff6b81;
            }
          }
          .clt-sampler .plot-area {
            width: 100%;
            min-height: 480px;
          }
          .clt-sampler .controls {
            display: grid;
            gap: 12px;
          }
          .clt-sampler .population-choice {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
          }
          .clt-sampler .population-choice button {
            font: 600 0.85rem system-ui, sans-serif;
            padding: 6px 12px;
            border-radius: 999px;
            border: 1px solid var(--line, #d9dee3);
            background: var(--panel, #ffffff);
            color: var(--fg, #1f2428);
            cursor: pointer;
          }
          .clt-sampler .population-choice button[aria-pressed="true"] {
            background: var(--clt-mean);
            color: #ffffff;
            border-color: var(--clt-mean);
          }
          .clt-sampler .control-row {
            display: grid;
            grid-template-columns: minmax(140px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }
          .clt-sampler .control-row input {
            width: 100%;
          }
          .clt-sampler .readout {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 24px;
            align-items: baseline;
            font: 600 0.95rem system-ui, sans-serif;
            color: var(--fg, #1f2428);
          }
          @media (max-width: 520px) {
            .clt-sampler .control-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div class="controls">
        <div class="population-choice" role="group" aria-label="Population shape">
          {POPULATIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={population === p.id}
              onClick={() => setPopulation(p.id)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <label class="control-row">
          <span>Sample size n = {n}</span>
          <input
            type="range"
            min={MIN_N}
            max={MAX_N}
            step={1}
            value={n}
            onInput={(event) => setN(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
      </div>

      <div class="readout">
        <span>Population mean = {popMean.toFixed(3)}</span>
        <span>Population std = {Math.sqrt(popVar).toFixed(3)}</span>
        <span>Empirical std of sample means = {sampleMeanStd.toFixed(3)}</span>
        <span>Theoretical std (population std / sqrt(n)) = {theoreticalStd.toFixed(3)}</span>
      </div>

      <div class="plot-area" ref={containerRef} />
    </section>
  );
}
