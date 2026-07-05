// Usage: <PenguinAverageBars client:load />
//
// Port of the V1 p5.js sketch (lab/interactive-v1/average_of_categorical_data.html)
// to plain canvas 2D. Draws one full-height colored bar per penguin (species.value == 1
// for its own indicator column), shuffled along the x-axis with a fixed seed so the
// layout is reproducible. A "Next" button reveals each species' average (== proportion)
// as a dashed horizontal line, one at a time, mirroring the original RIGHT-arrow-driven
// step sequence.
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

const WIDTH = 800;
const HEIGHT = 340;
const SEED = 7;

interface Species {
  name: string;
  count: number;
  average: number;
  color: string;
}

// Same proportions as the V1 sketch (from sns.load_dataset("penguins")).
const SPECIES: Species[] = [
  { name: "Adelie", count: 44, average: 0.44, color: "#e8735c" },
  { name: "Gentoo", count: 36, average: 0.36, color: "#4caf78" },
  { name: "Chinstrap", count: 20, average: 0.2, color: "#5b8fd9" }
];

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildShuffledPenguins(): string[] {
  const list: string[] = [];
  for (const s of SPECIES) {
    for (let i = 0; i < s.count; i++) list.push(s.name);
  }
  const rand = mulberry32(SEED);
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

export default function PenguinAverageBars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [step, setStep] = useState(0);
  const penguins = useMemo(() => buildShuffledPenguins(), []);

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
    const bg = style.getPropertyValue("--pab-bg").trim() || "#ffffff";
    const fg = style.getPropertyValue("--pab-fg").trim() || "#1f2428";

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // full-height indicator bars, one per penguin
    const barWidth = WIDTH / penguins.length;
    penguins.forEach((name, i) => {
      const species = SPECIES.find((s) => s.name === name)!;
      ctx.fillStyle = species.color;
      ctx.fillRect(i * barWidth, 0, barWidth + 0.5, HEIGHT);
    });

    // y-axis ticks at 0, 0.5, 1.0
    ctx.strokeStyle = fg;
    ctx.fillStyle = fg;
    ctx.font = "12px system-ui, sans-serif";
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach((v) => {
      const y = HEIGHT - v * HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(10, y);
      ctx.stroke();
      ctx.fillText(v.toFixed(1), 14, y + 4);
    });

    // revealed species-average dashed lines
    ctx.textAlign = "right";
    for (let i = 0; i < step; i++) {
      const species = SPECIES[i];
      const y = HEIGHT - species.average * HEIGHT;
      ctx.strokeStyle = species.color;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#000000";
      ctx.font = "bold 14px system-ui, sans-serif";
      ctx.fillText(`${species.name}  ${species.average.toFixed(2)}`, WIDTH - 12, y - 6);
    }
    ctx.textAlign = "left";
  }, [step, penguins]);

  const atEnd = step >= SPECIES.length;

  return (
    <section class="penguin-average-bars" aria-label="Interactive penguin species average reveal">
      <style>
        {`
          .penguin-average-bars {
            --pab-bg: #ffffff;
            --pab-fg: #1f2428;
            display: grid;
            gap: 14px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
          }
          @media (prefers-color-scheme: dark) {
            .penguin-average-bars {
              --pab-bg: #1d2022;
              --pab-fg: #eef1f2;
            }
          }
          .penguin-average-bars canvas {
            display: block;
            width: 100%;
            max-width: 800px;
            aspect-ratio: 800 / 340;
            border-radius: 4px;
          }
          .penguin-average-bars .controls {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .penguin-average-bars button {
            font: 600 0.9rem system-ui, sans-serif;
            padding: 6px 14px;
            border-radius: 6px;
            border: 1px solid var(--line, #d9dee3);
            background: var(--panel, #ffffff);
            color: var(--fg, #1f2428);
            cursor: pointer;
          }
          .penguin-average-bars button:hover {
            background: var(--muted-bg, #f2f4f5);
          }
          .penguin-average-bars .hint {
            font: 500 0.9rem system-ui, sans-serif;
            color: var(--muted, #647079);
          }
        `}
      </style>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      <div class="controls">
        <button
          type="button"
          onClick={() => setStep((s) => (s >= SPECIES.length ? 0 : s + 1))}
        >
          {atEnd ? "Restart" : "Show next species average →"}
        </button>
        <span class="hint">
          {atEnd
            ? "All species shown."
            : `${step} / ${SPECIES.length} species averages revealed`}
        </span>
      </div>
    </section>
  );
}
