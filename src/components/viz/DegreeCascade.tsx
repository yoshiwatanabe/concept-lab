// Usage: <DegreeCascade client:load />
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type Profile = "zero" | "constant" | "linear" | "quadratic";

const width = 760;
const panelHeight = 150;
const height = panelHeight * 3;
const pad = { left: 58, right: 24, top: 24, bottom: 34 };
const tMax = 6;
const samples = 240;

const profiles: Record<Profile, { label: string; degree: number; min: number; max: number; step: number; initial: number }> = {
  zero: { label: "a = 0", degree: 0, min: 0, max: 0, step: 1, initial: 0 },
  constant: { label: "a = c", degree: 0, min: -2, max: 4, step: 0.1, initial: 1.2 },
  linear: { label: "a = kt", degree: 1, min: -0.8, max: 1.6, step: 0.05, initial: 0.45 },
  quadratic: { label: "a = kt²", degree: 2, min: -0.25, max: 0.5, step: 0.01, initial: 0.08 }
};

function acceleration(profile: Profile, k: number, t: number) {
  if (profile === "zero") return 0;
  if (profile === "constant") return k;
  if (profile === "linear") return k * t;
  return k * t * t;
}

function velocity(profile: Profile, k: number, t: number) {
  if (profile === "zero") return 1.4;
  if (profile === "constant") return k * t;
  if (profile === "linear") return (k * t * t) / 2;
  return (k * t * t * t) / 3;
}

function position(profile: Profile, k: number, t: number) {
  if (profile === "zero") return 1.4 * t;
  if (profile === "constant") return (k * t * t) / 2;
  if (profile === "linear") return (k * t * t * t) / 6;
  return (k * t * t * t * t) / 12;
}

function degreeLabel(profile: Profile, kind: "a" | "v" | "x") {
  const aDegree = profiles[profile].degree;
  if (profile === "zero" && kind === "a") return "0次";
  if (profile === "zero" && kind === "v") return "0次";
  if (profile === "zero" && kind === "x") return "1次";
  const offset = kind === "a" ? 0 : kind === "v" ? 1 : 2;
  return `${aDegree + offset}次`;
}

function niceMax(values: number[]) {
  const abs = Math.max(1, ...values.map((value) => Math.abs(value)));
  const rough = abs * 1.18;
  const power = 10 ** Math.floor(Math.log10(rough));
  return Math.ceil(rough / power) * power;
}

function fmt(value: number) {
  if (Math.abs(value) < 1e-9) return "0.00";
  return value.toFixed(2);
}

export default function DegreeCascade() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profile, setProfile] = useState<Profile>("linear");
  const [param, setParam] = useState(profiles.linear.initial);
  const [cursor, setCursor] = useState(3);

  const active = profiles[profile];
  const effectiveParam = profile === "zero" ? 0 : param;

  const series = useMemo(() => {
    return Array.from({ length: samples + 1 }, (_, index) => {
      const t = (tMax * index) / samples;
      return {
        t,
        a: acceleration(profile, effectiveParam, t),
        v: velocity(profile, effectiveParam, t),
        x: position(profile, effectiveParam, t)
      };
    });
  }, [profile, effectiveParam]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--cascade-bg").trim() || "#ffffff";
    const grid = style.getPropertyValue("--cascade-grid").trim() || "#dde4ea";
    const fg = style.getPropertyValue("--cascade-fg").trim() || "#1f2428";
    const muted = style.getPropertyValue("--cascade-muted").trim() || "#647079";
    const colors = {
      x: style.getPropertyValue("--cascade-x").trim() || "#2563eb",
      v: style.getPropertyValue("--cascade-v").trim() || "#16a34a",
      a: style.getPropertyValue("--cascade-a").trim() || "#dc2626"
    };

    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);

    const panels: Array<{ key: "a" | "v" | "x"; title: string; color: string }> = [
      { key: "a", title: "Acceleration a(t)", color: colors.a },
      { key: "v", title: "Velocity v(t)", color: colors.v },
      { key: "x", title: "Position x(t)", color: colors.x }
    ];

    const plotW = width - pad.left - pad.right;
    const plotH = panelHeight - pad.top - pad.bottom;
    const toX = (t: number) => pad.left + (t / tMax) * plotW;

    panels.forEach((panel, panelIndex) => {
      const y0 = panelIndex * panelHeight;
      const values = series.map((point) => point[panel.key]);
      const yMax = niceMax(values);
      const yMin = -yMax;
      const toY = (value: number) => y0 + pad.top + ((yMax - value) / (yMax - yMin)) * plotH;

      context.strokeStyle = grid;
      context.lineWidth = 1;
      context.font = "12px system-ui, sans-serif";
      context.fillStyle = muted;
      for (let t = 0; t <= tMax; t += 1) {
        context.beginPath();
        context.moveTo(toX(t), y0 + pad.top);
        context.lineTo(toX(t), y0 + pad.top + plotH);
        context.stroke();
      }
      for (const y of [-yMax / 2, 0, yMax / 2]) {
        context.beginPath();
        context.moveTo(pad.left, toY(y));
        context.lineTo(width - pad.right, toY(y));
        context.stroke();
        context.fillText(fmt(y), 8, toY(y) + 4);
      }

      context.strokeStyle = fg;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(pad.left, toY(0));
      context.lineTo(width - pad.right, toY(0));
      context.stroke();

      context.strokeStyle = panel.color;
      context.lineWidth = 3;
      context.beginPath();
      series.forEach((point, index) => {
        const x = toX(point.t);
        const y = toY(point[panel.key]);
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.stroke();

      context.fillStyle = fg;
      context.font = "700 14px system-ui, sans-serif";
      context.fillText(`${panel.title}  ${degreeLabel(profile, panel.key)}`, pad.left, y0 + 17);
    });

    const cursorX = toX(cursor);
    context.strokeStyle = style.getPropertyValue("--cascade-cursor").trim() || "#111827";
    context.lineWidth = 1.5;
    context.setLineDash([6, 5]);
    context.beginPath();
    context.moveTo(cursorX, 12);
    context.lineTo(cursorX, height - 18);
    context.stroke();
    context.setLineDash([]);
  }, [series, profile, cursor]);

  const cursorA = acceleration(profile, effectiveParam, cursor);
  const cursorV = velocity(profile, effectiveParam, cursor);

  return (
    <section class="degree-cascade" aria-label="Interactive degree cascade plots">
      <style>{`
        .degree-cascade {
          --cascade-bg: #ffffff;
          --cascade-grid: #dde4ea;
          --cascade-fg: #1f2428;
          --cascade-muted: #647079;
          --cascade-cursor: #111827;
          --cascade-x: #2563eb;
          --cascade-v: #16a34a;
          --cascade-a: #dc2626;
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
          background: var(--panel, #ffffff);
        }
        @media (prefers-color-scheme: dark) {
          .degree-cascade {
            --cascade-bg: #1d2022;
            --cascade-grid: #343a40;
            --cascade-fg: #eef1f2;
            --cascade-muted: #aab3b9;
            --cascade-cursor: #e5e7eb;
            --cascade-x: #60a5fa;
            --cascade-v: #4ade80;
            --cascade-a: #f87171;
          }
        }
        .degree-cascade canvas {
          display: block;
          width: 100%;
          max-width: 760px;
          aspect-ratio: 760 / 450;
          touch-action: none;
        }
        .degree-cascade .controls {
          display: grid;
          gap: 12px;
        }
        .degree-cascade .selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          border: 0;
          padding: 0;
          margin: 0;
        }
        .degree-cascade .selector label,
        .degree-cascade .control-row,
        .degree-cascade .readout {
          color: var(--fg, #1f2428);
          font: 600 0.95rem system-ui, sans-serif;
        }
        .degree-cascade .selector span {
          display: inline-block;
          padding: 6px 10px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
        }
        .degree-cascade .selector input:checked + span {
          border-color: var(--cascade-fg);
          background: color-mix(in srgb, var(--cascade-fg) 10%, transparent);
        }
        .degree-cascade .control-row {
          display: grid;
          grid-template-columns: minmax(150px, max-content) 1fr;
          align-items: center;
          gap: 14px;
        }
        .degree-cascade input[type="range"] { width: 100%; }
        .degree-cascade .readout {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 22px;
        }
        @media (max-width: 560px) {
          .degree-cascade .control-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <div class="controls">
        <fieldset class="selector" aria-label="Acceleration profile">
          {(Object.keys(profiles) as Profile[]).map((key) => (
            <label>
              <input
                type="radio"
                name="acceleration-profile"
                value={key}
                checked={profile === key}
                onInput={() => {
                  setProfile(key);
                  setParam(profiles[key].initial);
                }}
              />
              <span>{profiles[key].label}</span>
            </label>
          ))}
        </fieldset>
        <label class="control-row">
          <span>Parameter = {effectiveParam.toFixed(2)}</span>
          <input
            type="range"
            min={active.min}
            max={active.max}
            step={active.step}
            value={effectiveParam}
            disabled={profile === "zero"}
            onInput={(event) => setParam(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
        <label class="control-row">
          <span>Time cursor t = {cursor.toFixed(2)}</span>
          <input
            type="range"
            min={0}
            max={tMax}
            step={0.01}
            value={cursor}
            onInput={(event) => setCursor(Number((event.currentTarget as HTMLInputElement).value))}
          />
        </label>
      </div>
      <canvas ref={canvasRef} width={width} height={height} />
      <div class="readout">
        <span>v slope = a(t) = {fmt(cursorA)}</span>
        <span>x slope = v(t) = {fmt(cursorV)}</span>
      </div>
    </section>
  );
}
