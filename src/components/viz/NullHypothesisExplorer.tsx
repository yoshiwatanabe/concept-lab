// Usage: <NullHypothesisExplorer client:load />
//
// Interactive replacement for the p-value-vs-hypothesized-proportion plot in
// lab/stats/null_hypothesis.ipynb (cell 1) and the moving-distribution V1
// animation (lab/interactive-v1/null_hypothesis.html). Observed data is fixed
// at 100/100 "black crows" (x = n = 100), so the one-tailed p-value for a
// hypothesized proportion p0 collapses to the exact closed form p0^100 - a
// slider lets the reader scrub p0 and watch the p-value curve and the
// reject/cannot-reject regions relative to alpha = 0.05.
import { useEffect, useRef, useState } from "preact/hooks";

const N_TRIALS = 100;
const ALPHA = 0.05;
const P0_MIN = 0.5;
const P0_MAX = 1.0;

function pValue(p0: number): number {
  return Math.pow(p0, N_TRIALS);
}

// Solve p0^100 = alpha  =>  p0 = alpha^(1/100)
const THRESHOLD = Math.pow(ALPHA, 1 / N_TRIALS);

const width = 680;
const height = 420;
const padding = 52;

function niceStep(span: number) {
  const rough = span / 8;
  const power = 10 ** Math.floor(Math.log10(rough));
  const scaled = rough / power;
  if (scaled >= 5) return 5 * power;
  if (scaled >= 2) return 2 * power;
  return power;
}

export default function NullHypothesisExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [p0, setP0] = useState(0.972);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--nh-bg").trim() || "#ffffff";
    const grid = style.getPropertyValue("--nh-grid").trim() || "#d8dee4";
    const axis = style.getPropertyValue("--nh-axis").trim() || "#1f2428";
    const muted = style.getPropertyValue("--nh-muted").trim() || "#647079";
    const line = style.getPropertyValue("--nh-line").trim() || "#0f766e";
    const sig = style.getPropertyValue("--nh-sig").trim() || "#d64550";
    const notSig = style.getPropertyValue("--nh-not-sig").trim() || "#2e8b57";

    const xMin = P0_MIN;
    const xMax = P0_MAX;
    const yMin = 0;
    const yMax = 1;

    const toX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * (width - padding * 2);
    const toY = (y: number) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - padding * 2);

    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);

    // Shaded "cannot reject H0" region (p0 >= threshold): p-value > alpha there
    context.fillStyle = notSig + "22";
    context.fillRect(toX(THRESHOLD), padding, toX(xMax) - toX(THRESHOLD), height - padding * 2);
    // Shaded "reject H0" region
    context.fillStyle = sig + "18";
    context.fillRect(toX(xMin), padding, toX(THRESHOLD) - toX(xMin), height - padding * 2);

    context.strokeStyle = grid;
    context.lineWidth = 1;
    context.font = "12px system-ui, sans-serif";
    context.fillStyle = muted;

    const xStep = niceStep(xMax - xMin);
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
      context.beginPath();
      context.moveTo(toX(x), padding);
      context.lineTo(toX(x), height - padding);
      context.stroke();
      context.fillText(x.toFixed(2), toX(x) - 12, height - padding + 20);
    }
    const yStep = niceStep(yMax - yMin);
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
      context.beginPath();
      context.moveTo(padding, toY(y));
      context.lineTo(width - padding, toY(y));
      context.stroke();
      context.fillText(y.toFixed(2), 12, toY(y) + 4);
    }

    context.strokeStyle = axis;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(padding, height - padding);
    context.lineTo(width - padding, height - padding);
    context.moveTo(padding, padding);
    context.lineTo(padding, height - padding);
    context.stroke();
    context.fillStyle = axis;
    context.fillText("Hypothesized proportion (p0)", width / 2 - 90, height - 8);
    context.save();
    context.translate(14, height / 2 + 40);
    context.rotate(-Math.PI / 2);
    context.fillText("p-value", 0, 0);
    context.restore();

    // alpha = 0.05 dashed line
    context.strokeStyle = sig;
    context.setLineDash([5, 4]);
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(padding, toY(ALPHA));
    context.lineTo(width - padding, toY(ALPHA));
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = sig;
    context.fillText("alpha = 0.05", width - padding - 70, toY(ALPHA) - 6);

    // threshold vertical dashed line
    context.strokeStyle = muted;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.moveTo(toX(THRESHOLD), padding);
    context.lineTo(toX(THRESHOLD), height - padding);
    context.stroke();
    context.setLineDash([]);

    // p-value curve p0^100
    context.strokeStyle = line;
    context.lineWidth = 3;
    context.beginPath();
    const sampleCount = 400;
    for (let i = 0; i <= sampleCount; i++) {
      const x = xMin + ((xMax - xMin) * i) / sampleCount;
      const y = pValue(x);
      const px = toX(x);
      const py = toY(Math.min(y, yMax));
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();

    // marker at current p0
    const currentP = pValue(p0);
    context.fillStyle = currentP < ALPHA ? sig : notSig;
    context.beginPath();
    context.arc(toX(p0), toY(Math.min(currentP, yMax)), 6, 0, Math.PI * 2);
    context.fill();
  }, [p0]);

  const currentP = pValue(p0);
  const isSignificant = currentP < ALPHA;

  return (
    <section class="null-hypothesis-explorer" aria-label="Interactive null hypothesis p-value explorer">
      <style>
        {`
          .null-hypothesis-explorer {
            --nh-bg: #ffffff;
            --nh-grid: #e3e7ea;
            --nh-axis: #1f2428;
            --nh-muted: #647079;
            --nh-line: #0f766e;
            --nh-sig: #d64550;
            --nh-not-sig: #2e8b57;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }

          @media (prefers-color-scheme: dark) {
            .null-hypothesis-explorer {
              --nh-bg: #1d2022;
              --nh-grid: #343a40;
              --nh-axis: #eef1f2;
              --nh-muted: #aab3b9;
              --nh-line: #5eead4;
              --nh-sig: #ff6b81;
              --nh-not-sig: #7fdba0;
            }
          }

          .null-hypothesis-explorer canvas {
            display: block;
            width: 100%;
            max-width: 680px;
            aspect-ratio: 680 / 420;
          }

          .null-hypothesis-explorer .control-row {
            display: grid;
            grid-template-columns: minmax(170px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .null-hypothesis-explorer .control-row input {
            width: 100%;
          }

          .null-hypothesis-explorer .readout {
            display: flex;
            flex-wrap: wrap;
            gap: 10px 24px;
            align-items: baseline;
            font: 600 1rem system-ui, sans-serif;
            color: var(--fg, #1f2428);
          }

          .null-hypothesis-explorer .badge {
            display: inline-block;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 0.85rem;
            font-weight: 700;
          }

          .null-hypothesis-explorer .badge.significant {
            background: #d64550;
            color: #fff;
          }

          .null-hypothesis-explorer .badge.not-significant {
            background: #2e8b57;
            color: #fff;
          }

          @media (max-width: 520px) {
            .null-hypothesis-explorer .control-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>

      <canvas ref={canvasRef} width={width} height={height} />

      <label class="control-row">
        <span>Hypothesized proportion p0 = {p0.toFixed(3)}</span>
        <input
          type="range"
          min={P0_MIN}
          max={P0_MAX}
          step={0.001}
          value={p0}
          onInput={(event) => setP0(Number((event.currentTarget as HTMLInputElement).value))}
        />
      </label>

      <div class="readout">
        <span>p-value = p0^100 = {currentP < 1e-4 ? currentP.toExponential(2) : currentP.toFixed(4)}</span>
        <span class={`badge ${isSignificant ? "significant" : "not-significant"}`}>
          {isSignificant ? "Reject H0 (p < 0.05)" : "Cannot reject H0 (p >= 0.05)"}
        </span>
      </div>
    </section>
  );
}
