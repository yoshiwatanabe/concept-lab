/** Usage: <LogisticExplorer client:load /> */
import { useEffect, useRef, useState } from "preact/hooks";

const width = 680;
const height = 420;
const padding = 48;

function sigmoid(z: number) {
  return 1 / (1 + Math.exp(-z));
}

function map(value: number, min: number, max: number, outMin: number, outMax: number) {
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

export default function LogisticExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(1);
  const [b, setB] = useState(0);

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
    const bg = styles.getPropertyValue("--logistic-bg").trim() || "#ffffff";
    const fg = styles.getPropertyValue("--logistic-fg").trim() || "#1f2428";
    const grid = styles.getPropertyValue("--logistic-grid").trim() || "#d8dee4";
    const line = styles.getPropertyValue("--logistic-line").trim() || "#0f766e";
    const muted = styles.getPropertyValue("--logistic-muted").trim() || "#647079";
    const xMin = -8;
    const xMax = 8;
    const yMin = -0.1;
    const yMax = 1.1;
    const toX = (x: number) => map(x, xMin, xMax, padding, width - padding);
    const toY = (y: number) => map(y, yMin, yMax, height - padding, padding);

    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = grid;
    context.lineWidth = 1;
    context.font = "12px system-ui, sans-serif";
    context.fillStyle = muted;
    for (let x = -8; x <= 8; x += 2) {
      context.beginPath();
      context.moveTo(toX(x), padding);
      context.lineTo(toX(x), height - padding);
      context.stroke();
      context.fillText(String(x), toX(x) - 5, height - padding + 20);
    }
    for (let y = 0; y <= 1.01; y += 0.25) {
      context.beginPath();
      context.moveTo(padding, toY(y));
      context.lineTo(width - padding, toY(y));
      context.stroke();
      context.fillText(y.toFixed(2), 10, toY(y) + 4);
    }

    context.strokeStyle = fg;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(padding, toY(0));
    context.lineTo(width - padding, toY(0));
    context.moveTo(toX(0), padding);
    context.lineTo(toX(0), height - padding);
    context.stroke();

    context.strokeStyle = line;
    context.lineWidth = 3;
    context.beginPath();
    for (let i = 0; i <= 420; i += 1) {
      const x = xMin + ((xMax - xMin) * i) / 420;
      const y = sigmoid(w * x + b);
      const px = toX(x);
      const py = toY(y);
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();

    const midpoint = -b / w;
    if (Number.isFinite(midpoint) && midpoint >= xMin && midpoint <= xMax) {
      context.fillStyle = line;
      context.beginPath();
      context.arc(toX(midpoint), toY(0.5), 5, 0, Math.PI * 2);
      context.fill();
    }

    context.fillStyle = fg;
    context.font = "600 14px system-ui, sans-serif";
    context.fillText(`sigma(${w.toFixed(2)}x ${b < 0 ? "-" : "+"} ${Math.abs(b).toFixed(2)})`, padding, 24);
  }, [w, b]);

  return (
    <section class="logistic-explorer" aria-label="Logistic function parameter explorer">
      <style>
        {`
          .logistic-explorer {
            --logistic-bg: #ffffff;
            --logistic-fg: #1f2428;
            --logistic-grid: #d8dee4;
            --logistic-line: #0f766e;
            --logistic-muted: #647079;
            display: grid;
            gap: 12px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }
          @media (prefers-color-scheme: dark) {
            .logistic-explorer {
              --logistic-bg: #1d2022;
              --logistic-fg: #eef1f2;
              --logistic-grid: #343a40;
              --logistic-line: #5eead4;
              --logistic-muted: #aab3b9;
            }
          }
          .logistic-explorer canvas {
            display: block;
            width: 100%;
            max-width: 680px;
            aspect-ratio: 680 / 420;
          }
          .logistic-explorer label {
            display: grid;
            grid-template-columns: 88px 1fr;
            gap: 12px;
            align-items: center;
            font: 600 0.95rem system-ui, sans-serif;
          }
          .logistic-explorer input {
            width: 100%;
          }
        `}
      </style>
      <canvas ref={canvasRef} width={width} height={height} />
      <label>
        <span>w = {w.toFixed(2)}</span>
        <input type="range" min="0.2" max="6" step="0.1" value={w} aria-label="w parameter" onInput={(event) => setW(Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
      <label>
        <span>b = {b.toFixed(2)}</span>
        <input type="range" min="-5" max="5" step="0.1" value={b} aria-label="b parameter" onInput={(event) => setB(Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
    </section>
  );
}
