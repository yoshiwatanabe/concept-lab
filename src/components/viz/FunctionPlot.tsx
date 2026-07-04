import { useEffect, useRef, useState } from "preact/hooks";

type PresetName = "parabola";

interface Props {
  fn?: PresetName;
  min?: number;
  max?: number;
  step?: number;
  initial?: number;
}

const width = 680;
const height = 420;
const padding = 48;

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

export default function FunctionPlot({
  fn = "parabola",
  min = -2,
  max = 2,
  step = 0.1,
  initial = 1
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(initial);

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

    const xMin = -4;
    const xMax = 4;
    const sampleCount = 320;
    const values = Array.from({ length: sampleCount + 1 }, (_, index) => {
      const x = xMin + ((xMax - xMin) * index) / sampleCount;
      const y = fn === "parabola" ? a * x * x : 0;
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
  }, [a, fn]);

  return (
    <section class="function-plot" aria-label="Interactive function plot">
      <style>
        {`
          .function-plot {
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
            .function-plot {
              --plot-bg: #1d2022;
              --plot-grid: #343a40;
              --plot-axis: #eef1f2;
              --plot-line: #5eead4;
              --plot-muted: #aab3b9;
            }
          }

          .function-plot canvas {
            display: block;
            width: 100%;
            max-width: 680px;
            aspect-ratio: 680 / 420;
          }

          .plot-control {
            display: grid;
            grid-template-columns: minmax(64px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .plot-control input {
            width: 100%;
          }

          @media (max-width: 520px) {
            .plot-control {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      <canvas ref={canvasRef} width={width} height={height} />
      <label class="plot-control">
        <span>a = {a.toFixed(1)}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={a}
          onInput={(event) => setA(Number((event.currentTarget as HTMLInputElement).value))}
        />
      </label>
    </section>
  );
}
