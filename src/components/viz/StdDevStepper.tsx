// Usage: <StdDevStepper client:load />
//
// Port of the V1 p5.js sketch (lab/interactive-v1/standard_deviation_for_population.html)
// to plain canvas 2D. A fixed 5-point dataset [3, 5, 2, 6, 4] is revealed step by step:
// 0 raw bars -> 1 mean line -> 2 deviation lines -> 3 squared-deviation squares ->
// 4 sum-of-squares square -> 5 variance (sum / n) -> 6 population standard deviation (sqrt).
import { useEffect, useRef, useState } from "preact/hooks";

const DATA = [3, 5, 2, 6, 4];
const N = DATA.length;
const MEAN = DATA.reduce((a, b) => a + b, 0) / N;
const DIFFS = DATA.map((x) => x - MEAN);
const SQUARES = DIFFS.map((d) => d * d);
const SUM_SQUARES = SQUARES.reduce((a, b) => a + b, 0);
const VARIANCE = SUM_SQUARES / N;
const STD_DEV = Math.sqrt(VARIANCE);

const WIDTH = 620;
const HEIGHT = 480;
const MARGIN = 130;
const BAR_WIDTH = 40;
const MAX_DATA = Math.max(...DATA);
const SPACING = (WIDTH - 2 * MARGIN - N * BAR_WIDTH) / (N - 1);
const SCALE_SQ = 12;

const STEP_LABELS = [
  "0. Data",
  "1. Mean",
  "2. Deviations (xi - mean)",
  "3. Squared deviations",
  "4. Sum of squares",
  "5. Variance = sum / n",
  "6. Std. deviation = sqrt(variance)"
];

export default function StdDevStepper() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--sds-bg").trim() || "#f2f4f5";
    const fg = style.getPropertyValue("--sds-fg").trim() || "#1f2428";
    const bar = style.getPropertyValue("--sds-bar").trim() || "#4682b4";
    const mean = style.getPropertyValue("--sds-mean").trim() || "#dc143c";
    const sq = style.getPropertyValue("--sds-sq").trim() || "#c8649a";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const barX = (i: number) => MARGIN + i * (BAR_WIDTH + SPACING);
    const valueToY = (v: number) => HEIGHT - MARGIN - v * ((HEIGHT - 2 * MARGIN) / MAX_DATA);

    // 1. bars (always shown)
    ctx.fillStyle = bar;
    for (let i = 0; i < N; i++) {
      const x = barX(i);
      const h = DATA[i] * ((HEIGHT - 2 * MARGIN) / MAX_DATA);
      ctx.fillRect(x, HEIGHT - MARGIN - h, BAR_WIDTH, h);
      ctx.fillStyle = fg;
      ctx.font = "14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(String(DATA[i]), x + BAR_WIDTH / 2, HEIGHT - MARGIN - h - 10);
      ctx.fillStyle = bar;
    }

    // 2. mean line
    if (step >= 1) {
      const meanY = valueToY(MEAN);
      ctx.strokeStyle = mean;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(MARGIN - 10, meanY);
      ctx.lineTo(WIDTH - MARGIN + 10, meanY);
      ctx.stroke();
      ctx.fillStyle = mean;
      ctx.textAlign = "right";
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.fillText(`mean = ${MEAN.toFixed(2)}`, MARGIN - 16, meanY + 4);
    }

    // 3. deviation lines
    if (step >= 2) {
      const meanY = valueToY(MEAN);
      ctx.strokeStyle = fg;
      ctx.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        const x = barX(i) + BAR_WIDTH / 2;
        const topY = valueToY(DATA[i]);
        ctx.beginPath();
        ctx.moveTo(x, topY);
        ctx.lineTo(x, meanY);
        ctx.stroke();
      }
    }

    // 4. squared-deviation squares beneath each bar
    if (step >= 3) {
      ctx.fillStyle = sq;
      ctx.textAlign = "center";
      for (let i = 0; i < N; i++) {
        const side = SQUARES[i] * SCALE_SQ;
        const x = barX(i) + BAR_WIDTH / 2 - side / 2;
        const y = HEIGHT - MARGIN + 10;
        ctx.fillRect(x, y, side, side);
        ctx.fillStyle = fg;
        ctx.font = "12px system-ui, sans-serif";
        ctx.fillText(SQUARES[i].toFixed(2), x + side / 2, y + side / 2 + 4);
        ctx.fillStyle = sq;
      }
    }

    // 5. sum-of-squares square, top-left
    if (step >= 4) {
      const side = SUM_SQUARES * SCALE_SQ;
      const x = 20;
      const y = 20;
      ctx.strokeStyle = fg;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, side, side);
      ctx.fillStyle = fg;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`sum of squares = ${SUM_SQUARES.toFixed(2)}`, x, y - 8);
    }

    // 6. variance readout
    if (step >= 5) {
      ctx.fillStyle = fg;
      ctx.font = "600 14px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`variance = ${SUM_SQUARES.toFixed(2)} / ${N} = ${VARIANCE.toFixed(2)}`, WIDTH - 260, 40);
    }

    // 7. std dev readout
    if (step >= 6) {
      ctx.fillStyle = mean;
      ctx.font = "700 15px system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(`std. deviation = sqrt(${VARIANCE.toFixed(2)}) = ${STD_DEV.toFixed(2)}`, WIDTH - 260, 64);
    }

    ctx.textAlign = "left";
  }, [step]);

  return (
    <section class="std-dev-stepper" aria-label="Interactive standard deviation step-through">
      <style>
        {`
          .std-dev-stepper {
            --sds-bg: #f2f4f5;
            --sds-fg: #1f2428;
            --sds-bar: #4682b4;
            --sds-mean: #dc143c;
            --sds-sq: #c8649a;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }
          @media (prefers-color-scheme: dark) {
            .std-dev-stepper {
              --sds-bg: #24282a;
              --sds-fg: #eef1f2;
              --sds-bar: #7fb2dc;
              --sds-mean: #ff6b81;
              --sds-sq: #e6a0c8;
            }
          }
          .std-dev-stepper canvas {
            display: block;
            width: 100%;
            max-width: 620px;
            aspect-ratio: 620 / 480;
            border-radius: 4px;
          }
          .std-dev-stepper .controls {
            display: flex;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
          }
          .std-dev-stepper button {
            font: 600 0.9rem system-ui, sans-serif;
            padding: 6px 14px;
            border-radius: 6px;
            border: 1px solid var(--line, #d9dee3);
            background: var(--panel, #ffffff);
            color: var(--fg, #1f2428);
            cursor: pointer;
          }
          .std-dev-stepper button:disabled {
            opacity: 0.4;
            cursor: default;
          }
          .std-dev-stepper button:hover:not(:disabled) {
            background: var(--muted-bg, #f2f4f5);
          }
          .std-dev-stepper .step-label {
            font: 600 0.95rem system-ui, sans-serif;
            color: var(--fg, #1f2428);
          }
        `}
      </style>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      <div class="controls">
        <button type="button" disabled={step <= 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          ← Previous
        </button>
        <button type="button" disabled={step >= 6} onClick={() => setStep((s) => Math.min(6, s + 1))}>
          Next →
        </button>
        <span class="step-label">{STEP_LABELS[step]}</span>
      </div>
    </section>
  );
}
