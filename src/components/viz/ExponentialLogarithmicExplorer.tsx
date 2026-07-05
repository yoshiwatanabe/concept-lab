/** Usage: <ExponentialLogarithmicExplorer client:load /> */
import { useEffect, useRef, useState } from "preact/hooks";

type BaseName = "e" | "2" | "10";

const width = 680;
const height = 520;
const padding = 48;

const bases: Record<BaseName, { value: number; color: string; label: string }> = {
  e: { value: Math.E, color: "#c2410c", label: "e" },
  "2": { value: 2, color: "#1d4ed8", label: "2" },
  "10": { value: 10, color: "#15803d", label: "10" }
};

function map(value: number, min: number, max: number, outMin: number, outMax: number) {
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

function drawCurve(
  context: CanvasRenderingContext2D,
  fn: (x: number) => number,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  color: string,
  start: number,
  end: number
) {
  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  let first = true;
  for (let i = 0; i <= 360; i += 1) {
    const x = start + ((end - start) * i) / 360;
    const y = fn(x);
    if (!Number.isFinite(y) || y < yMin - 2 || y > yMax + 2) {
      first = true;
      continue;
    }
    const px = map(x, xMin, xMax, padding, width - padding);
    const py = map(y, yMin, yMax, height - padding, padding);
    if (first) {
      context.moveTo(px, py);
      first = false;
    } else {
      context.lineTo(px, py);
    }
  }
  context.stroke();
}

export default function ExponentialLogarithmicExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [baseName, setBaseName] = useState<BaseName>("e");
  const [x, setX] = useState(1);

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

    const styles = getComputedStyle(canvas);
    const bg = styles.getPropertyValue("--explorer-bg").trim() || "#ffffff";
    const fg = styles.getPropertyValue("--explorer-fg").trim() || "#1f2428";
    const grid = styles.getPropertyValue("--explorer-grid").trim() || "#d8dee4";
    const muted = styles.getPropertyValue("--explorer-muted").trim() || "#647079";
    const selected = bases[baseName];
    const xMin = -5;
    const xMax = 5;
    const yMin = -5;
    const yMax = 5;
    const toX = (value: number) => map(value, xMin, xMax, padding, width - padding);
    const toY = (value: number) => map(value, yMin, yMax, height - padding, padding);

    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);
    context.font = "12px system-ui, sans-serif";
    context.strokeStyle = grid;
    context.lineWidth = 1;
    context.fillStyle = muted;
    for (let tick = -5; tick <= 5; tick += 1) {
      context.beginPath();
      context.moveTo(toX(tick), padding);
      context.lineTo(toX(tick), height - padding);
      context.moveTo(padding, toY(tick));
      context.lineTo(width - padding, toY(tick));
      context.stroke();
      if (tick !== 0) {
        context.fillText(String(tick), toX(tick) - 4, toY(0) + 18);
        context.fillText(String(tick), toX(0) + 8, toY(tick) + 4);
      }
    }

    context.strokeStyle = fg;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(toX(0), padding);
    context.lineTo(toX(0), height - padding);
    context.moveTo(padding, toY(0));
    context.lineTo(width - padding, toY(0));
    context.stroke();

    context.strokeStyle = muted;
    context.setLineDash([6, 5]);
    context.beginPath();
    context.moveTo(toX(xMin), toY(xMin));
    context.lineTo(toX(xMax), toY(xMax));
    context.stroke();
    context.setLineDash([]);

    (Object.keys(bases) as BaseName[]).forEach((key) => {
      const base = bases[key];
      context.globalAlpha = key === baseName ? 1 : 0.28;
      drawCurve(context, (value) => base.value ** value, xMin, xMax, yMin, yMax, base.color, xMin, xMax);
      drawCurve(context, (value) => Math.log(value) / Math.log(base.value), xMin, xMax, yMin, yMax, base.color, 0.02, xMax);
      context.globalAlpha = 1;
    });

    const expY = selected.value ** x;
    const logX = expY;
    const logY = Math.log(expY) / Math.log(selected.value);
    context.fillStyle = selected.color;
    context.beginPath();
    context.arc(toX(x), toY(expY), 5, 0, Math.PI * 2);
    context.arc(toX(logX), toY(logY), 5, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = selected.color;
    context.setLineDash([4, 4]);
    context.beginPath();
    context.moveTo(toX(x), toY(expY));
    context.lineTo(toX(logX), toY(logY));
    context.stroke();
    context.setLineDash([]);

    context.fillStyle = fg;
    context.font = "600 14px system-ui, sans-serif";
    context.fillText(`base ${selected.label}: x=${x.toFixed(2)}, ${selected.label}^x=${expY.toFixed(2)}, log_${selected.label}(${expY.toFixed(2)})=${logY.toFixed(2)}`, padding, 26);
  }, [baseName, x]);

  return (
    <section class="exp-log-explorer" aria-label="Exponential and logarithmic inverse explorer">
      <style>
        {`
          .exp-log-explorer {
            --explorer-bg: #ffffff;
            --explorer-fg: #1f2428;
            --explorer-grid: #d8dee4;
            --explorer-muted: #647079;
            display: grid;
            gap: 12px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
            color: var(--fg, #1f2428);
          }
          @media (prefers-color-scheme: dark) {
            .exp-log-explorer {
              --explorer-bg: #1d2022;
              --explorer-fg: #eef1f2;
              --explorer-grid: #343a40;
              --explorer-muted: #aab3b9;
            }
          }
          .exp-log-explorer canvas {
            display: block;
            width: 100%;
            max-width: 680px;
            aspect-ratio: 680 / 520;
          }
          .exp-log-explorer__controls {
            display: grid;
            grid-template-columns: max-content 1fr max-content;
            gap: 14px;
            align-items: center;
            font: 600 0.95rem system-ui, sans-serif;
          }
          .exp-log-explorer__radios {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }
          .exp-log-explorer input[type="range"] {
            width: 100%;
          }
          @media (max-width: 600px) {
            .exp-log-explorer__controls {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      <canvas ref={canvasRef} width={width} height={height} />
      <div class="exp-log-explorer__controls">
        <div class="exp-log-explorer__radios" aria-label="Base">
          {(Object.keys(bases) as BaseName[]).map((key) => (
            <label>
              <input type="radio" name="exp-log-base" checked={baseName === key} onInput={() => setBaseName(key)} /> {bases[key].label}
            </label>
          ))}
        </div>
        <input type="range" min="-3" max="3" step="0.01" value={x} aria-label="x value" onInput={(event) => setX(Number((event.currentTarget as HTMLInputElement).value))} />
        <span>x = {x.toFixed(2)}</span>
      </div>
    </section>
  );
}
