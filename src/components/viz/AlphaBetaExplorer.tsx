// Usage: <AlphaBetaExplorer client:load />
//
// Interactive replacement for the V1 matplotlib 2x2 grid
// (lab/stats/alpha_error_beta_error.ipynb, cell 4: "different alpha /
// effect-size combinations") and the p5.js sketch
// (lab/interactive-v1/alpha_error_beta_error.html). Draws the null (H0)
// and alternative (H1) normal distributions with a two-tailed critical
// region, and shades Type I error (alpha), Type II error (beta), and power
// (1-beta) live as the significance level and effect size sliders move.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import { normalCdf, normalPdf, normalQuantile } from "./statmath";

const STD_DEV = 1.0;
const X_MIN = -5;
const X_MAX = 6;
const POINTS = 400;

interface Props {
  initialAlpha?: number;
  initialEffectSize?: number;
}

export default function AlphaBetaExplorer({
  initialAlpha = 0.05,
  initialEffectSize = 1.0
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const plotlyRef = useRef<any>(null);
  const [alpha, setAlpha] = useState(initialAlpha);
  const [effectSize, setEffectSize] = useState(initialEffectSize);

  const xs = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= POINTS; i++) {
      arr.push(X_MIN + ((X_MAX - X_MIN) * i) / POINTS);
    }
    return arr;
  }, []);

  // Two-tailed critical value for the null distribution N(0, 1).
  const criticalValue = useMemo(() => normalQuantile(1 - alpha / 2), [alpha]);

  // Type II error (beta): probability mass of H1 between -crit and +crit.
  const beta = useMemo(
    () =>
      normalCdf(criticalValue, effectSize, STD_DEV) -
      normalCdf(-criticalValue, effectSize, STD_DEV),
    [criticalValue, effectSize]
  );
  const power = 1 - beta;

  function buildFigure() {
    const container = containerRef.current;
    const style = container ? getComputedStyle(container) : null;
    const cssVar = (name: string, fallback: string) =>
      style?.getPropertyValue(name).trim() || fallback;
    const fg = cssVar("--ab-fg", "#1f2428");
    const grid = cssVar("--ab-grid", "#d8dee4");
    const bg = cssVar("--ab-bg", "#ffffff");
    const nullColor = cssVar("--ab-null", "#4682b4");
    const altColor = cssVar("--ab-alt", "#dc143c");
    const critColor = cssVar("--ab-crit", "#8b008b");
    const alphaFill = "rgba(70, 130, 180, 0.35)";
    const betaFill = "rgba(220, 20, 60, 0.30)";
    const powerFill = "rgba(46, 139, 87, 0.30)";

    const yNull = xs.map((x) => normalPdf(x, 0, STD_DEV));
    const yAlt = xs.map((x) => normalPdf(x, effectSize, STD_DEV));

    const alphaLeftX = xs.filter((x) => x <= -criticalValue);
    const alphaLeftY = alphaLeftX.map((x) => normalPdf(x, 0, STD_DEV));
    const alphaRightX = xs.filter((x) => x >= criticalValue);
    const alphaRightY = alphaRightX.map((x) => normalPdf(x, 0, STD_DEV));

    const betaX = xs.filter((x) => x >= -criticalValue && x <= criticalValue);
    const betaY = betaX.map((x) => normalPdf(x, effectSize, STD_DEV));

    const powerLeftX = xs.filter((x) => x <= -criticalValue);
    const powerLeftY = powerLeftX.map((x) => normalPdf(x, effectSize, STD_DEV));
    const powerRightX = xs.filter((x) => x >= criticalValue);
    const powerRightY = powerRightX.map((x) => normalPdf(x, effectSize, STD_DEV));

    function filledArea(x: number[], y: number[], color: string, name: string, legend: boolean) {
      return {
        x,
        y,
        type: "scatter",
        mode: "lines",
        fill: "tozeroy",
        fillcolor: color,
        line: { width: 0 },
        name,
        showlegend: legend,
        hoverinfo: "skip"
      };
    }

    const data = [
      filledArea(alphaLeftX, alphaLeftY, alphaFill, "Type I Error (alpha)", true),
      filledArea(alphaRightX, alphaRightY, alphaFill, "Type I Error (alpha)", false),
      filledArea(betaX, betaY, betaFill, "Type II Error (beta)", true),
      filledArea(powerLeftX, powerLeftY, powerFill, "Power (1-beta)", true),
      filledArea(powerRightX, powerRightY, powerFill, "Power (1-beta)", false),
      {
        x: xs,
        y: yNull,
        type: "scatter",
        mode: "lines",
        name: "Null Hypothesis (H0: mu=0)",
        line: { color: nullColor, width: 2 }
      },
      {
        x: xs,
        y: yAlt,
        type: "scatter",
        mode: "lines",
        name: `Alternative Hypothesis (H1: mu=${effectSize.toFixed(1)})`,
        line: { color: altColor, width: 2 }
      }
    ];

    const layout = {
      paper_bgcolor: bg,
      plot_bgcolor: bg,
      font: { color: fg, family: "system-ui, sans-serif" },
      margin: { t: 30, b: 50, l: 55, r: 20 },
      showlegend: true,
      legend: { orientation: "h", y: 1.2 },
      xaxis: { title: { text: "Test statistic" }, gridcolor: grid, range: [X_MIN, X_MAX] },
      yaxis: { title: { text: "Probability density" }, gridcolor: grid, rangemode: "tozero" },
      shapes: [
        {
          type: "line",
          xref: "x",
          yref: "paper",
          x0: criticalValue,
          x1: criticalValue,
          y0: 0,
          y1: 1,
          line: { color: critColor, width: 2, dash: "dash" }
        },
        {
          type: "line",
          xref: "x",
          yref: "paper",
          x0: -criticalValue,
          x1: -criticalValue,
          y0: 0,
          y1: 1,
          line: { color: critColor, width: 2, dash: "dash" }
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
  }, [alpha, effectSize]);

  return (
    <section class="alpha-beta-explorer" aria-label="Interactive Type I / Type II error explorer">
      <style>
        {`
          .alpha-beta-explorer {
            --ab-bg: #ffffff;
            --ab-grid: #e3e7ea;
            --ab-fg: #1f2428;
            --ab-null: #4682b4;
            --ab-alt: #dc143c;
            --ab-crit: #8b008b;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }

          @media (prefers-color-scheme: dark) {
            .alpha-beta-explorer {
              --ab-bg: #1d2022;
              --ab-grid: #343a40;
              --ab-fg: #eef1f2;
              --ab-null: #7fb2dc;
              --ab-alt: #ff6b81;
              --ab-crit: #d18ce8;
            }
          }

          .alpha-beta-explorer .plot-area {
            width: 100%;
            min-height: 420px;
          }

          .alpha-beta-explorer .controls {
            display: grid;
            gap: 12px;
          }

          .alpha-beta-explorer .control-row {
            display: grid;
            grid-template-columns: minmax(170px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .alpha-beta-explorer .control-row input {
            width: 100%;
          }

          .alpha-beta-explorer .readout {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 24px;
            align-items: baseline;
            font: 600 1rem system-ui, sans-serif;
            color: var(--fg, #1f2428);
          }

          @media (max-width: 520px) {
            .alpha-beta-explorer .control-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <div class="controls">
        <label class="control-row">
          <span>Significance level (alpha) = {alpha.toFixed(2)}</span>
          <input
            type="range"
            min={0.01}
            max={0.2}
            step={0.01}
            value={alpha}
            onInput={(event) => setAlpha(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
        <label class="control-row">
          <span>Effect size (d) = {effectSize.toFixed(1)}</span>
          <input
            type="range"
            min={0}
            max={3}
            step={0.1}
            value={effectSize}
            onInput={(event) =>
              setEffectSize(Number((event.currentTarget as HTMLInputElement).value))
            }
          />
        </label>
      </div>

      <div class="readout">
        <span>Critical value = &plusmn;{criticalValue.toFixed(2)}</span>
        <span>alpha = {alpha.toFixed(3)}</span>
        <span>beta = {beta.toFixed(3)}</span>
        <span>Power (1-beta) = {power.toFixed(3)}</span>
      </div>

      <div class="plot-area" ref={containerRef} />
    </section>
  );
}
