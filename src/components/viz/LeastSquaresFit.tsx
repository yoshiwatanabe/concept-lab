// Usage: <LeastSquaresFit client:load />
//
// Port of the V1 p5.js sketch (lab/interactive-v1/least_squires_method.html) to plain
// canvas 2D. A fixed set of 9 data points is shown with a draggable-by-slider fitting
// line y = a*x + b. Each point's squared residual is drawn as a red square (side length
// = |residual|); the sum of all squared residuals is shown as a translucent green
// square in the corner, whose side is sqrt(sum of squared residuals).
import { useEffect, useRef, useState } from "preact/hooks";

const DATA_POINTS = [
  { x: 100, y: 130 },
  { x: 150, y: 160 },
  { x: 200, y: 190 },
  { x: 250, y: 240 },
  { x: 300, y: 250 },
  { x: 350, y: 300 },
  { x: 400, y: 340 },
  { x: 450, y: 360 },
  { x: 500, y: 420 }
];

const WIDTH = 600;
const HEIGHT = 600;
const MARGIN = 50;

interface Props {
  initialSlope?: number;
  initialIntercept?: number;
}

export default function LeastSquaresFit({ initialSlope = 1, initialIntercept = 50 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(initialSlope);
  const [b, setB] = useState(initialIntercept);

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
    const bg = style.getPropertyValue("--lsf-bg").trim() || "#ffffff";
    const fg = style.getPropertyValue("--lsf-fg").trim() || "#1f2428";
    const residualColor = style.getPropertyValue("--lsf-residual").trim() || "#e04040";
    const lineColor = style.getPropertyValue("--lsf-line").trim() || "#1a9850";
    const sumColor = style.getPropertyValue("--lsf-sum").trim() || "#1a9850";
    const connectorColor = style.getPropertyValue("--lsf-connector").trim() || "#9696ff";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // toCanvasY flips the data's y-up convention into canvas y-down pixels.
    const toCanvasY = (y: number) => HEIGHT - y;

    // axes
    ctx.strokeStyle = fg;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(MARGIN, MARGIN);
    ctx.lineTo(MARGIN, HEIGHT - MARGIN);
    ctx.moveTo(MARGIN, HEIGHT - MARGIN);
    ctx.lineTo(WIDTH - MARGIN, HEIGHT - MARGIN);
    ctx.stroke();

    let totalSquaredError = 0;

    for (const pt of DATA_POINTS) {
      const predictedY = a * pt.x + b;
      const residual = pt.y - predictedY;
      const absResidual = Math.abs(residual);
      totalSquaredError += residual * residual;

      // connector line between actual and predicted y
      ctx.strokeStyle = connectorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pt.x, toCanvasY(pt.y));
      ctx.lineTo(pt.x, toCanvasY(predictedY));
      ctx.stroke();

      // residual square: side = |residual|, anchored at the predicted-value edge
      const sqSize = absResidual;
      const sqX = pt.x - sqSize / 2;
      const sqY = residual >= 0 ? toCanvasY(predictedY) - sqSize : toCanvasY(predictedY);
      ctx.strokeStyle = residualColor;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(sqX, sqY, sqSize, sqSize);

      // data point
      ctx.fillStyle = fg;
      ctx.beginPath();
      ctx.arc(pt.x, toCanvasY(pt.y), 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // fitting line across the plot width
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    const x1 = MARGIN;
    const y1 = a * x1 + b;
    const x2 = WIDTH - MARGIN;
    const y2 = a * x2 + b;
    ctx.beginPath();
    ctx.moveTo(x1, toCanvasY(y1));
    ctx.lineTo(x2, toCanvasY(y2));
    ctx.stroke();

    // sum-of-squares square in the top-left of the plot area
    const totalErrorSide = Math.sqrt(totalSquaredError);
    ctx.fillStyle = sumColor;
    ctx.globalAlpha = 0.2;
    ctx.fillRect(MARGIN, MARGIN, totalErrorSide, totalErrorSide);
    ctx.globalAlpha = 1;

    // readout text
    ctx.fillStyle = fg;
    ctx.font = "600 15px system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`Total squared error: ${totalSquaredError.toFixed(2)}`, MARGIN, MARGIN - 12);
    ctx.fillText(`sqrt(total squared error): ${totalErrorSide.toFixed(2)}`, MARGIN + 230, MARGIN - 12);
  }, [a, b]);

  return (
    <section class="least-squares-fit" aria-label="Interactive least squares fit explorer">
      <style>
        {`
          .least-squares-fit {
            --lsf-bg: #ffffff;
            --lsf-fg: #1f2428;
            --lsf-residual: #e04040;
            --lsf-line: #1a9850;
            --lsf-sum: #1a9850;
            --lsf-connector: #9696ff;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }
          @media (prefers-color-scheme: dark) {
            .least-squares-fit {
              --lsf-bg: #1d2022;
              --lsf-fg: #eef1f2;
              --lsf-residual: #ff6b6b;
              --lsf-line: #5fd68a;
              --lsf-sum: #5fd68a;
              --lsf-connector: #b3b3ff;
            }
          }
          .least-squares-fit canvas {
            display: block;
            width: 100%;
            max-width: 600px;
            aspect-ratio: 1 / 1;
            border-radius: 4px;
          }
          .least-squares-fit .control-row {
            display: grid;
            grid-template-columns: minmax(140px, max-content) 1fr;
            align-items: center;
            gap: 14px;
            color: var(--fg, #1f2428);
            font: 600 0.95rem system-ui, sans-serif;
          }
          .least-squares-fit .control-row input {
            width: 100%;
          }
          @media (max-width: 520px) {
            .least-squares-fit .control-row {
              grid-template-columns: 1fr;
            }
          }
        `}
      </style>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      <label class="control-row">
        <span>Slope a = {a.toFixed(2)}</span>
        <input
          type="range"
          min={-2}
          max={2}
          step={0.01}
          value={a}
          onInput={(event) => setA(Number((event.currentTarget as HTMLInputElement).value))}
        />
      </label>
      <label class="control-row">
        <span>Intercept b = {b.toFixed(0)}</span>
        <input
          type="range"
          min={-200}
          max={200}
          step={1}
          value={b}
          onInput={(event) => setB(Number((event.currentTarget as HTMLInputElement).value))}
        />
      </label>
    </section>
  );
}
