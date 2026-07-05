// Usage: <FunctionDegreeExplorer client:load /> — compare y = a*x^n for degree n = 1..4,
// with an optional "wave" mode for degree 4 (y = a*x^4 - 4x^2), and a sign/magnitude slider for a.
import { useEffect, useRef, useState } from "preact/hooks";

const width = 680;
const height = 420;
const padding = 48;
const xMin = -2;
const xMax = 2;

function niceStep(span: number) {
  const rough = span / 8;
  const power = 10 ** Math.floor(Math.log10(rough));
  const scaled = rough / power;
  if (scaled >= 5) return 5 * power;
  if (scaled >= 2) return 2 * power;
  return power;
}

function formatTick(value: number) {
  if (Math.abs(value) < 1e-10) return "0";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatCoefficient(a: number) {
  if (Math.abs(a - 1) < 1e-9) return "";
  if (Math.abs(a + 1) < 1e-9) return "-";
  return a.toString();
}

export default function FunctionDegreeExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [degree, setDegree] = useState(2);
  const [a, setA] = useState(1);
  const [wave, setWave] = useState(false);

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
    context.clearRect(0, 0, width, height);

    const sampleCount = 320;
    const values = Array.from({ length: sampleCount + 1 }, (_, index) => {
      const x = xMin + ((xMax - xMin) * index) / sampleCount;
      let y = a * x ** degree;
      if (degree === 4 && wave) y -= 4 * x ** 2;
      return { x, y };
    });

    const yAbs = Math.max(1, ...values.map((point) => Math.abs(point.y)));
    const yMax = Math.ceil(yAbs * 1.15);
    const yMin = -yMax;

    const toX = (x: number) => padding + ((x - xMin) / (xMax - xMin)) * (width - padding * 2);
    const toY = (y: number) => height - padding - ((y - yMin) / (yMax - yMin)) * (height - padding * 2);

    context.fillStyle = getComputedStyle(canvas).getPropertyValue("--plot-bg").trim() || "#ffffff";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--plot-grid").trim() || "#d8dee4";
    context.lineWidth = 1;
    context.font = "12px system-ui, sans-serif";
    context.fillStyle = getComputedStyle(canvas).getPropertyValue("--plot-muted").trim() || "#647079";

    const xStep = niceStep(xMax - xMin);
    for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 1e-9; x += xStep) {
      context.beginPath();
      context.moveTo(toX(x), padding);
      context.lineTo(toX(x), height - padding);
      context.stroke();
      context.fillText(formatTick(x), toX(x) - 7, height - padding + 20);
    }

    const yStep = niceStep(yMax - yMin);
    for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax + 1e-9; y += yStep) {
      context.beginPath();
      context.moveTo(padding, toY(y));
      context.lineTo(width - padding, toY(y));
      context.stroke();
      context.fillText(formatTick(y), 12, toY(y) + 4);
    }

    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--plot-axis").trim() || "#1f2428";
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(toX(0), padding);
    context.lineTo(toX(0), height - padding);
    context.moveTo(padding, toY(0));
    context.lineTo(width - padding, toY(0));
    context.stroke();

    context.fillStyle = getComputedStyle(canvas).getPropertyValue("--plot-axis").trim() || "#1f2428";
    context.fillText("x", width - padding + 15, toY(0) + 4);
    context.fillText("y", toX(0) + 8, padding - 14);

    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--plot-line").trim() || "#0f766e";
    context.lineWidth = 3;
    context.beginPath();
    values.forEach((point, index) => {
      const x = toX(point.x);
      const y = toY(point.y);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();
  }, [a, degree, wave]);

  const formula =
    degree === 4 && wave
      ? `y = ${formatCoefficient(a)}x⁴ - 4x²`
      : `y = ${formatCoefficient(a)}x${degree === 1 ? "" : `^${degree}`}`;

  return (
    <section class="degree-explorer" aria-label="Interactive polynomial degree comparison">
      <style>
        {`
          .degree-explorer {
            --plot-bg: #ffffff;
            --plot-grid: #d8dee4;
            --plot-axis: #1f2428;
            --plot-line: #0f766e;
            --plot-muted: #647079;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }

          @media (prefers-color-scheme: dark) {
            .degree-explorer {
              --plot-bg: #1d2022;
              --plot-grid: #343a40;
              --plot-axis: #eef1f2;
              --plot-line: #5eead4;
              --plot-muted: #aab3b9;
            }
          }

          .degree-explorer canvas {
            display: block;
            width: 100%;
            max-width: 680px;
            aspect-ratio: 680 / 420;
          }

          .degree-controls {
            display: grid;
            gap: 10px;
          }

          .degree-buttons {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }

          .degree-buttons button {
            font: 600 0.9rem system-ui, sans-serif;
            padding: 6px 14px;
            border-radius: 6px;
            border: 1px solid var(--line, #d9dee3);
            background: var(--panel, #ffffff);
            color: var(--fg, #1f2428);
            cursor: pointer;
          }

          .degree-buttons button[aria-pressed="true"] {
            background: #0f766e;
            border-color: #0f766e;
            color: white;
          }

          .plot-control {
            display: grid;
            grid-template-columns: minmax(96px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .plot-control input[type="range"] {
            width: 100%;
          }

          .wave-toggle {
            display: flex;
            align-items: center;
            gap: 8px;
            font: 600 0.9rem system-ui, sans-serif;
            color: var(--fg, #1f2428);
          }

          .formula {
            font: 600 1rem "Cambria Math", Georgia, serif;
            color: var(--fg, #1f2428);
          }

          @media (max-width: 520px) {
            .plot-control {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      <canvas ref={canvasRef} width={width} height={height} />
      <div class="degree-controls">
        <div class="degree-buttons" role="group" aria-label="Degree selector">
          {[1, 2, 3, 4].map((n) => (
            <button
              key={n}
              type="button"
              aria-pressed={degree === n}
              onClick={() => setDegree(n)}
            >
              degree {n}
            </button>
          ))}
        </div>
        <label class="plot-control">
          <span>a = {a.toFixed(1)}</span>
          <input
            type="range"
            min={-5}
            max={5}
            step={0.5}
            value={a}
            onInput={(event) => setA(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
        {degree === 4 && (
          <label class="wave-toggle">
            <input
              type="checkbox"
              checked={wave}
              onChange={(event) => setWave((event.currentTarget as HTMLInputElement).checked)}
            />
            wave-like (y = ax⁴ − 4x²)
          </label>
        )}
        <div class="formula">{formula}</div>
      </div>
    </section>
  );
}
