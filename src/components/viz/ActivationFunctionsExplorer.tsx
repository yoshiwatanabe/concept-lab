/** Usage: <ActivationFunctionsExplorer client:load /> */
import { useEffect, useRef, useState } from "preact/hooks";

type ActivationName = "relu" | "sigmoid" | "tanh" | "leakyRelu" | "elu" | "swish" | "gelu";

const width = 680;
const height = 420;
const padding = 48;

const activations: Array<{ key: ActivationName; label: string; color: string }> = [
  { key: "relu", label: "ReLU", color: "#1d4ed8" },
  { key: "sigmoid", label: "Sigmoid", color: "#15803d" },
  { key: "tanh", label: "Tanh", color: "#b91c1c" },
  { key: "leakyRelu", label: "Leaky ReLU", color: "#7e22ce" },
  { key: "elu", label: "ELU", color: "#c2410c" },
  { key: "swish", label: "Swish", color: "#0f766e" },
  { key: "gelu", label: "GELU", color: "#4338ca" }
];

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function gelu(x: number) {
  return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
}

function valueFor(name: ActivationName, x: number, alpha: number) {
  if (name === "relu") return Math.max(0, x);
  if (name === "sigmoid") return sigmoid(x);
  if (name === "tanh") return Math.tanh(x);
  if (name === "leakyRelu") return x > 0 ? x : alpha * x;
  if (name === "elu") return x >= 0 ? x : alpha * (Math.exp(x) - 1);
  if (name === "swish") return x * sigmoid(x);
  return gelu(x);
}

function map(value: number, min: number, max: number, outMin: number, outMax: number) {
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}

export default function ActivationFunctionsExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState<ActivationName>("relu");
  const [alpha, setAlpha] = useState(0.1);

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
    const bg = styles.getPropertyValue("--activation-bg").trim() || "#ffffff";
    const fg = styles.getPropertyValue("--activation-fg").trim() || "#1f2428";
    const grid = styles.getPropertyValue("--activation-grid").trim() || "#d8dee4";
    const muted = styles.getPropertyValue("--activation-muted").trim() || "#647079";
    const current = activations.find((item) => item.key === selected) ?? activations[0];
    const xMin = -6;
    const xMax = 6;
    const yMin = -2;
    const yMax = 6;
    const toX = (x: number) => map(x, xMin, xMax, padding, width - padding);
    const toY = (y: number) => map(y, yMin, yMax, height - padding, padding);

    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = grid;
    context.lineWidth = 1;
    context.font = "12px system-ui, sans-serif";
    context.fillStyle = muted;
    for (let x = -6; x <= 6; x += 2) {
      context.beginPath();
      context.moveTo(toX(x), padding);
      context.lineTo(toX(x), height - padding);
      context.stroke();
      context.fillText(String(x), toX(x) - 5, height - padding + 20);
    }
    for (let y = -2; y <= 6; y += 1) {
      context.beginPath();
      context.moveTo(padding, toY(y));
      context.lineTo(width - padding, toY(y));
      context.stroke();
      context.fillText(String(y), 16, toY(y) + 4);
    }

    context.strokeStyle = fg;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(padding, toY(0));
    context.lineTo(width - padding, toY(0));
    context.moveTo(toX(0), padding);
    context.lineTo(toX(0), height - padding);
    context.stroke();

    context.strokeStyle = current.color;
    context.lineWidth = 3;
    context.beginPath();
    for (let i = 0; i <= 520; i += 1) {
      const x = xMin + ((xMax - xMin) * i) / 520;
      const y = valueFor(selected, x, alpha);
      const px = toX(x);
      const py = toY(y);
      if (i === 0) context.moveTo(px, py);
      else context.lineTo(px, py);
    }
    context.stroke();

    context.fillStyle = fg;
    context.font = "600 14px system-ui, sans-serif";
    context.fillText(current.label, padding, 24);
  }, [selected, alpha]);

  return (
    <section class="activation-explorer" aria-label="Activation function explorer">
      <style>
        {`
          .activation-explorer {
            --activation-bg: #ffffff;
            --activation-fg: #1f2428;
            --activation-grid: #d8dee4;
            --activation-muted: #647079;
            display: grid;
            gap: 12px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }
          @media (prefers-color-scheme: dark) {
            .activation-explorer {
              --activation-bg: #1d2022;
              --activation-fg: #eef1f2;
              --activation-grid: #343a40;
              --activation-muted: #aab3b9;
            }
          }
          .activation-explorer canvas {
            display: block;
            width: 100%;
            max-width: 680px;
            aspect-ratio: 680 / 420;
          }
          .activation-explorer__select,
          .activation-explorer label {
            display: grid;
            grid-template-columns: 120px 1fr;
            gap: 12px;
            align-items: center;
            font: 600 0.95rem system-ui, sans-serif;
          }
          .activation-explorer select,
          .activation-explorer input {
            width: 100%;
          }
        `}
      </style>
      <canvas ref={canvasRef} width={width} height={height} />
      <div class="activation-explorer__select">
        <span>Function</span>
        <select value={selected} aria-label="Activation function" onInput={(event) => setSelected((event.currentTarget as HTMLSelectElement).value as ActivationName)}>
          {activations.map((item) => (
            <option value={item.key}>{item.label}</option>
          ))}
        </select>
      </div>
      <label>
        <span>alpha = {alpha.toFixed(2)}</span>
        <input type="range" min="0.01" max="1" step="0.01" value={alpha} aria-label="alpha parameter" onInput={(event) => setAlpha(Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
    </section>
  );
}
