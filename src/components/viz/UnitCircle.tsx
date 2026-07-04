/** Usage: <UnitCircle client:load mode="circle+waves" /> */
import { useEffect, useRef, useState } from "preact/hooks";
import type P5 from "p5";

type Mode = "circle" | "circle+waves";

interface Props {
  mode: Mode;
}

const logical = {
  circle: { width: 400, height: 400 },
  "circle+waves": { width: 800, height: 400 }
} satisfies Record<Mode, { width: number; height: number }>;

function normalizeAngle(angle: number) {
  const tau = Math.PI * 2;
  return ((angle % tau) + tau) % tau;
}

function buildHistory(angle: number, maxLength: number) {
  const samples = Math.max(1, Math.min(maxLength, Math.round((normalizeAngle(angle) || Math.PI * 2) / 0.02)));
  const sine: number[] = [];
  const cosine: number[] = [];
  const tangent: number[] = [];

  for (let index = 0; index < samples; index += 1) {
    const current = (angle * index) / Math.max(1, samples - 1);
    sine.push(Math.sin(current));
    cosine.push(Math.cos(current));
    tangent.push(Math.tan(current));
  }

  return { sine, cosine, tangent };
}

function formatValue(value: number) {
  if (!Number.isFinite(value) || Math.abs(value) > 999) return value < 0 ? "-∞" : "∞";
  return value.toFixed(2);
}

export default function UnitCircle({ mode }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const angleRef = useRef(0);
  const playingRef = useRef(false);
  const historiesRef = useRef({ sine: [] as number[], cosine: [] as number[], tangent: [] as number[] });
  const [angle, setAngle] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    playingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);

  useEffect(() => {
    let sketch: P5 | undefined;
    let resizeObserver: ResizeObserver | undefined;
    let disposed = false;

    async function mount() {
      const p5 = (await import("p5")).default;
      if (disposed || !hostRef.current) return;

      const host = hostRef.current;
      const size = logical[mode];
      const getPalette = () => {
        const styles = getComputedStyle(host);
        return {
          bg: styles.getPropertyValue("--unit-bg").trim() || "#ffffff",
          fg: styles.getPropertyValue("--unit-fg").trim() || "#1f2428",
          muted: styles.getPropertyValue("--unit-muted").trim() || "#647079",
          radius: styles.getPropertyValue("--unit-radius").trim() || "#d62728",
          sine: styles.getPropertyValue("--unit-sine").trim() || "#16803c",
          cosine: styles.getPropertyValue("--unit-cosine").trim() || "#1f5fbf",
          tangent: styles.getPropertyValue("--unit-tangent").trim() || "#b76500",
          grid: styles.getPropertyValue("--unit-grid").trim() || "#d8dee4"
        };
      };

      const sketchFactory = (p: P5) => {
        let scale = 1;

        const resize = () => {
          const available = Math.max(280, host.clientWidth);
          const width = Math.min(size.width, available);
          scale = width / size.width;
          p.resizeCanvas(width, size.height * scale);
        };

        const setAngleFromPointer = () => {
          const cx = 200 * scale;
          const cy = 200 * scale;
          const next = normalizeAngle(Math.atan2(cy - p.mouseY, p.mouseX - cx));
          angleRef.current = next;
          setAngle(next);
          if (mode === "circle+waves") {
            historiesRef.current = buildHistory(next, Math.max(1, Math.floor(size.width - 400)));
          }
        };

        const drawCircle = (palette: ReturnType<typeof getPalette>) => {
          const cx = 200;
          const cy = 200;
          const r = 150;
          const current = angleRef.current;
          const x = cx + r * Math.cos(current);
          const y = cy - r * Math.sin(current);
          const tangent = Math.tan(current);
          const tx = cx + r;
          const ty = cy - r * tangent;

          p.stroke(palette.fg);
          p.strokeWeight(1.5);
          p.noFill();
          p.ellipse(cx, cy, r * 2, r * 2);

          p.stroke(palette.grid);
          p.line(cx - r - 20, cy, cx + r + 24, cy);
          p.line(cx, cy - r - 20, cx, cy + r + 20);

          p.stroke(palette.radius);
          p.strokeWeight(2);
          p.line(cx, cy, x, y);

          p.stroke(palette.sine);
          p.line(x, y, x, cy);
          p.stroke(palette.cosine);
          p.line(x, y, cx, y);

          p.stroke(palette.tangent);
          p.line(cx + r, cy, tx, ty);

          p.noStroke();
          p.fill(palette.fg);
          p.ellipse(x, y, 8, 8);
          p.fill(palette.sine);
          p.ellipse(x, cy, 8, 8);
          p.fill(palette.cosine);
          p.ellipse(cx, y, 8, 8);
          p.fill(palette.tangent);
          p.ellipse(tx, ty, 8, 8);

          p.noStroke();
          p.fill(palette.fg);
          p.textSize(16);
          p.text(`Angle: ${p.degrees(current).toFixed(2)}° (${current.toFixed(2)} rad)`, 10, 22);
          p.text(`Sine: ${formatValue(Math.sin(current))}`, 10, 44);
          p.text(`Cosine: ${formatValue(Math.cos(current))}`, 10, 66);
          p.text(`Tangent: ${formatValue(tangent)}`, 10, 88);
        };

        const drawWaves = (palette: ReturnType<typeof getPalette>) => {
          const histories = historiesRef.current;
          p.push();
          p.translate(400, 200);
          p.stroke(palette.fg);
          p.strokeWeight(1);
          p.line(0, 0, size.width - 400, 0);
          p.stroke(palette.grid);
          p.line(0, -50, size.width - 400, -50);
          p.line(0, 50, size.width - 400, 50);

          const drawHistory = (values: number[], color: string, label: string) => {
            p.stroke(color);
            p.strokeWeight(2);
            p.noFill();
            p.beginShape();
            values.forEach((value, index) => {
              p.vertex(index, -value * 50);
            });
            p.endShape();

            if (values.length > 0) {
              p.noStroke();
              p.fill(color);
              p.textSize(14);
              p.text(label, 0, -values[values.length - 1] * 50 - 15);
            }
          };

          drawHistory(histories.sine, palette.sine, "sin");
          drawHistory(histories.cosine, palette.cosine, "cos");
          drawHistory(histories.tangent, palette.tangent, "tan");
          p.pop();
        };

        p.setup = () => {
          const canvas = p.createCanvas(size.width, size.height);
          canvas.parent(host);
          canvas.elt.setAttribute("aria-label", mode === "circle" ? "Interactive unit circle" : "Interactive unit circle and trigonometric waves");
          resize();
          p.textFont("system-ui, sans-serif");
        };

        p.draw = () => {
          const palette = getPalette();
          p.background(palette.bg);
          p.push();
          p.scale(scale);
          drawCircle(palette);

          if (mode === "circle+waves") {
            if (playingRef.current) {
              const next = angleRef.current + 0.02;
              if (next > Math.PI * 2) {
                angleRef.current = next - Math.PI * 2;
                historiesRef.current = { sine: [], cosine: [], tangent: [] };
              } else {
                angleRef.current = next;
              }

              historiesRef.current.sine.push(Math.sin(angleRef.current));
              historiesRef.current.cosine.push(Math.cos(angleRef.current));
              historiesRef.current.tangent.push(Math.tan(angleRef.current));

              const maxLength = size.width - 400;
              if (historiesRef.current.sine.length > maxLength) {
                historiesRef.current.sine.shift();
                historiesRef.current.cosine.shift();
                historiesRef.current.tangent.shift();
              }
              setAngle(angleRef.current);
            } else if (mode === "circle" && playingRef.current) {
              angleRef.current = normalizeAngle(angleRef.current + 0.02);
              setAngle(angleRef.current);
            }

            drawWaves(palette);
          } else if (playingRef.current) {
            angleRef.current = normalizeAngle(angleRef.current + 0.02);
            setAngle(angleRef.current);
          }

          p.pop();
        };

        p.mousePressed = () => {
          if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            setIsPlaying(false);
            setAngleFromPointer();
          }
        };

        p.mouseDragged = () => {
          if (p.mouseX >= 0 && p.mouseX <= p.width && p.mouseY >= 0 && p.mouseY <= p.height) {
            setAngleFromPointer();
          }
        };

        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
      };

      sketch = new p5(sketchFactory);
    }

    mount();

    return () => {
      disposed = true;
      resizeObserver?.disconnect();
      sketch?.remove();
    };
  }, [mode]);

  const degrees = (angle * 180) / Math.PI;

  return (
    <section class="unit-circle" aria-label={mode === "circle" ? "Unit circle interactive visualization" : "Unit circle and waves interactive visualization"}>
      <style>
        {`
          .unit-circle {
            --unit-bg: #ffffff;
            --unit-fg: #1f2428;
            --unit-muted: #647079;
            --unit-radius: #d62728;
            --unit-sine: #16803c;
            --unit-cosine: #1f5fbf;
            --unit-tangent: #b76500;
            --unit-grid: #d8dee4;
            display: grid;
            gap: 12px;
            padding: 16px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 8px;
            background: var(--panel, #ffffff);
            color: var(--fg, #1f2428);
          }

          @media (prefers-color-scheme: dark) {
            .unit-circle {
              --unit-bg: #1d2022;
              --unit-fg: #eef1f2;
              --unit-muted: #aab3b9;
              --unit-radius: #ff6b6b;
              --unit-sine: #61d394;
              --unit-cosine: #7aa2ff;
              --unit-tangent: #f4a340;
              --unit-grid: #343a40;
            }
          }

          .unit-circle__canvas {
            width: 100%;
          }

          .unit-circle canvas {
            display: block;
            max-width: 100%;
            height: auto;
          }

          .unit-circle__controls {
            display: grid;
            grid-template-columns: auto minmax(0, 1fr) minmax(96px, max-content);
            align-items: center;
            gap: 12px;
            font: 600 0.95rem system-ui, sans-serif;
          }

          .unit-circle__button {
            min-height: 36px;
            padding: 0 14px;
            border: 1px solid var(--line, #d9dee3);
            border-radius: 6px;
            background: var(--panel, #ffffff);
            color: inherit;
            font: inherit;
            cursor: pointer;
          }

          .unit-circle__button:hover {
            border-color: var(--unit-muted);
          }

          .unit-circle__slider {
            width: 100%;
          }

          .unit-circle__readout {
            color: var(--unit-muted);
            text-align: right;
            white-space: nowrap;
          }

          @media (max-width: 560px) {
            .unit-circle__controls {
              grid-template-columns: 1fr;
            }

            .unit-circle__readout {
              text-align: left;
            }
          }
        `}
      </style>
      <div ref={hostRef} class="unit-circle__canvas" />
      <div class="unit-circle__controls">
        <button class="unit-circle__button" type="button" onClick={() => setIsPlaying((value) => !value)}>
          {isPlaying ? "Pause" : "Play"}
        </button>
        <input
          class="unit-circle__slider"
          type="range"
          min="0"
          max="360"
          step="0.1"
          value={degrees}
          aria-label="Angle in degrees"
          onInput={(event) => {
            setIsPlaying(false);
            const next = normalizeAngle((Number((event.currentTarget as HTMLInputElement).value) * Math.PI) / 180);
            angleRef.current = next;
            setAngle(next);
            if (mode === "circle+waves") {
              historiesRef.current = buildHistory(next, logical[mode].width - 400);
            }
          }}
        />
        <span class="unit-circle__readout">{degrees.toFixed(1)}°</span>
      </div>
    </section>
  );
}
