// Usage: <OhmsLawExplorer client:load /> — drag the I and R sliders to see V = I x R
// update live, plotted as a line V(R) for the current I, with the (R, V) point marked.
import { useEffect, useRef, useState } from "preact/hooks";

const width = 680;
const height = 420;
const padding = 48;
const rMax = 20;
const iMax = 10;

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

export default function OhmsLawExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [current, setCurrent] = useState(4);
  const [resistance, setResistance] = useState(10);

  const voltage = current * resistance;

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

    const xMin = 0;
    const xMax = rMax;
    const yMax = Math.ceil((iMax * rMax * 1.1) / 20) * 20;
    const yMin = 0;

    const toX = (r: number) => padding + ((r - xMin) / (xMax - xMin)) * (width - padding * 2);
    const toY = (v: number) => height - padding - ((v - yMin) / (yMax - yMin)) * (height - padding * 2);

    context.fillStyle = getComputedStyle(canvas).getPropertyValue("--plot-bg").trim() || "#ffffff";
    context.fillRect(0, 0, width, height);

    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--plot-grid").trim() || "#d8dee4";
    context.lineWidth = 1;
    context.font = "12px system-ui, sans-serif";
    context.fillStyle = getComputedStyle(canvas).getPropertyValue("--plot-muted").trim() || "#647079";

    const xStep = niceStep(xMax - xMin);
    for (let r = 0; r <= xMax + 1e-9; r += xStep) {
      context.beginPath();
      context.moveTo(toX(r), padding);
      context.lineTo(toX(r), height - padding);
      context.stroke();
      context.fillText(formatTick(r), toX(r) - 7, height - padding + 20);
    }

    const yStep = niceStep(yMax - yMin);
    for (let v = 0; v <= yMax + 1e-9; v += yStep) {
      context.beginPath();
      context.moveTo(padding, toY(v));
      context.lineTo(width - padding, toY(v));
      context.stroke();
      context.fillText(formatTick(v), 8, toY(v) + 4);
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
    context.fillText("R (Ohm)", width - padding - 40, toY(0) + 20);
    context.fillText("V (V)", toX(0) + 8, padding - 14);

    // V = I * R line across the full R range at the current I
    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--plot-line").trim() || "#0f766e";
    context.lineWidth = 3;
    context.beginPath();
    const sampleCount = 100;
    for (let index = 0; index <= sampleCount; index++) {
      const r = xMin + ((xMax - xMin) * index) / sampleCount;
      const v = current * r;
      const x = toX(r);
      const y = toY(v);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    }
    context.stroke();

    // Marker at the current (R, V) point
    context.fillStyle = getComputedStyle(canvas).getPropertyValue("--plot-marker").trim() || "#e11d48";
    context.beginPath();
    context.arc(toX(resistance), toY(voltage), 6, 0, 2 * Math.PI);
    context.fill();

    context.strokeStyle = getComputedStyle(canvas).getPropertyValue("--plot-marker").trim() || "#e11d48";
    context.setLineDash([4, 4]);
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(toX(resistance), toY(0));
    context.lineTo(toX(resistance), toY(voltage));
    context.moveTo(toX(0), toY(voltage));
    context.lineTo(toX(resistance), toY(voltage));
    context.stroke();
    context.setLineDash([]);
  }, [current, resistance]);

  return (
    <section class="ohms-law-explorer" aria-label="Interactive Ohm's Law explorer">
      <style>
        {`
          .ohms-law-explorer {
            --plot-bg: #ffffff;
            --plot-grid: #d8dee4;
            --plot-axis: #1f2428;
            --plot-line: #0f766e;
            --plot-muted: #647079;
            --plot-marker: #e11d48;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }

          @media (prefers-color-scheme: dark) {
            .ohms-law-explorer {
              --plot-bg: #1d2022;
              --plot-grid: #343a40;
              --plot-axis: #eef1f2;
              --plot-line: #5eead4;
              --plot-muted: #aab3b9;
              --plot-marker: #fb7185;
            }
          }

          .ohms-law-explorer canvas {
            display: block;
            width: 100%;
            max-width: 680px;
            aspect-ratio: 680 / 420;
          }

          .ohms-controls {
            display: grid;
            gap: 12px;
          }

          .plot-control {
            display: grid;
            grid-template-columns: minmax(110px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }

          .plot-control input[type="range"] {
            width: 100%;
          }

          .ohms-readout {
            font: 700 1.1rem system-ui, sans-serif;
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
      <div class="ohms-controls">
        <label class="plot-control">
          <span>I = {current.toFixed(1)} A</span>
          <input
            type="range"
            min={0}
            max={iMax}
            step={0.1}
            value={current}
            onInput={(event) => setCurrent(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
        <label class="plot-control">
          <span>R = {resistance.toFixed(1)} Ohm</span>
          <input
            type="range"
            min={0}
            max={rMax}
            step={0.1}
            value={resistance}
            onInput={(event) => setResistance(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
        <div class="ohms-readout">
          V = I x R = {current.toFixed(1)} x {resistance.toFixed(1)} = {voltage.toFixed(1)} V
        </div>
      </div>
    </section>
  );
}
