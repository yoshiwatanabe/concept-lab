// Usage: <TDistributionExplorer client:load />
//
// Interactive replacement for the V1 p5.js sketch
// (lab/interactive-v1/degree_of_freedom_t_test.html): as the degrees-of-freedom
// slider moves, the Student-t probability density is redrawn against the
// fixed standard normal curve, showing the heavier tails at low df collapsing
// onto the normal as df grows.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { normalPdf, studentTPdf } from "./statmath";

const X_MIN = -5;
const X_MAX = 5;
const POINTS = 400;

interface Props {
  initialDf?: number;
  minDf?: number;
  maxDf?: number;
}

export default function TDistributionExplorer({
  initialDf = 5,
  minDf = 1,
  maxDf = 30
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);
  const [df, setDf] = useState(initialDf);

  const xs = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= POINTS; i++) {
      arr.push(X_MIN + ((X_MAX - X_MIN) * i) / POINTS);
    }
    return arr;
  }, []);

  const yNormal = useMemo(() => xs.map((x) => normalPdf(x, 0, 1)), [xs]);
  const yT = useMemo(() => xs.map((x) => studentTPdf(x, df)), [xs, df]);

  function buildFigure() {
    const container = containerRef.current;
    const style = container ? getComputedStyle(container) : null;
    const cssVar = (name: string, fallback: string) =>
      style?.getPropertyValue(name).trim() || fallback;
    const fg = cssVar("--td-fg", "#1f2428");
    const grid = cssVar("--td-grid", "#d8dee4");
    const bg = cssVar("--td-bg", "#ffffff");
    const tColor = cssVar("--td-t", "#dc143c");
    const normalColor = cssVar("--td-normal", "#4682b4");

    const data = [
      {
        x: xs,
        y: yNormal,
        type: "scatter",
        mode: "lines",
        name: "Standard normal",
        line: { color: normalColor, width: 2, dash: "dash" }
      },
      {
        x: xs,
        y: yT,
        type: "scatter",
        mode: "lines",
        name: `t-distribution (df=${df})`,
        line: { color: tColor, width: 2.5 }
      }
    ];

    const layout = {
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fg, family: "system-ui, sans-serif" },
      margin: { t: 30, b: 50, l: 55, r: 20 },
      showlegend: true,
      legend: { orientation: "h", y: 1.15 },
      xaxis: { title: { text: "x" }, gridcolor: grid, range: [X_MIN, X_MAX] },
      yaxis: { title: { text: "Probability density" }, gridcolor: grid, rangemode: "tozero" }
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
  }, [df]);

  return (
    <section class="t-distribution-explorer" aria-label="Interactive t-distribution vs normal explorer">
      <style>
        {`
          .t-distribution-explorer {
            --td-bg: #ffffff;
            --td-grid: #e3e7ea;
            --td-fg: #1f2428;
            --td-t: #dc143c;
            --td-normal: #4682b4;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }

          @media (prefers-color-scheme: dark) {
            .t-distribution-explorer {
              --td-bg: #1d2022;
              --td-grid: #343a40;
              --td-fg: #eef1f2;
              --td-t: #ff6b81;
              --td-normal: #7fb2dc;
            }
          }

          .t-distribution-explorer .plot-area {
            width: 100%;
            min-height: 400px;
          }

          .t-distribution-explorer .control-row {
            display: grid;
            grid-template-columns: minmax(140px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .t-distribution-explorer .control-row input {
            width: 100%;
          }

          @media (max-width: 520px) {
            .t-distribution-explorer .control-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <label class="control-row">
        <span>Degrees of freedom (df) = {df}</span>
        <input
          type="range"
          min={minDf}
          max={maxDf}
          step={1}
          value={df}
          onInput={(event) => setDf(Number((event.currentTarget as HTMLInputElement).value))}
        />
      </label>

      <div class="plot-area" ref={containerRef} />
    </section>
  );
}
