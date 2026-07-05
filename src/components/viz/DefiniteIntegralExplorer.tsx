// Usage: <DefiniteIntegralExplorer client:load />
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type VelocityProfile = "constant" | "linear" | "quadratic";

const width = 760;
const height = 420;
const pad = { left: 62, right: 24, top: 26, bottom: 48 };
const tMax = 5;
const samples = 280;

function velocity(profile: VelocityProfile, t: number) {
  if (profile === "constant") return 60;
  if (profile === "linear") return 20 + 18 * t;
  return 12 + 6 * t * t;
}

function antiderivative(profile: VelocityProfile, t: number) {
  if (profile === "constant") return 60 * t;
  if (profile === "linear") return 20 * t + 9 * t * t;
  return 12 * t + 2 * t * t * t;
}

function profileLabel(profile: VelocityProfile) {
  if (profile === "constant") return "const 60";
  if (profile === "linear") return "linear";
  return "quadratic";
}

function fmt(value: number) {
  return value.toFixed(2);
}

export default function DefiniteIntegralExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profile, setProfile] = useState<VelocityProfile>("constant");
  const [a, setA] = useState(1);
  const [b, setB] = useState(3);
  const [showRiemann, setShowRiemann] = useState(false);

  const left = Math.min(a, b);
  const right = Math.max(a, b);
  const fa = antiderivative(profile, left);
  const fb = antiderivative(profile, right);

  const points = useMemo(
    () =>
      Array.from({ length: samples + 1 }, (_, index) => {
        const t = (tMax * index) / samples;
        return { t, v: velocity(profile, t) };
      }),
    [profile]
  );

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
    const bg = style.getPropertyValue("--di-bg").trim() || "#ffffff";
    const grid = style.getPropertyValue("--di-grid").trim() || "#dde4ea";
    const fg = style.getPropertyValue("--di-fg").trim() || "#1f2428";
    const muted = style.getPropertyValue("--di-muted").trim() || "#647079";
    const curve = style.getPropertyValue("--di-curve").trim() || "#16a34a";
    const pale = style.getPropertyValue("--di-pale").trim() || "rgba(37, 99, 235, 0.14)";
    const medium = style.getPropertyValue("--di-medium").trim() || "rgba(37, 99, 235, 0.24)";
    const band = style.getPropertyValue("--di-band").trim() || "rgba(220, 38, 38, 0.28)";

    context.fillStyle = bg;
    context.fillRect(0, 0, width, height);

    const plotW = width - pad.left - pad.right;
    const plotH = height - pad.top - pad.bottom;
    const yMax = Math.ceil(Math.max(...points.map((point) => point.v)) * 1.16 / 20) * 20;
    const toX = (t: number) => pad.left + (t / tMax) * plotW;
    const toY = (v: number) => pad.top + ((yMax - v) / yMax) * plotH;
    const baseY = toY(0);

    function fillArea(t0: number, t1: number, fillStyle: string) {
      context.fillStyle = fillStyle;
      context.beginPath();
      context.moveTo(toX(t0), baseY);
      for (let i = 0; i <= samples; i += 1) {
        const t = t0 + ((t1 - t0) * i) / samples;
        context.lineTo(toX(t), toY(velocity(profile, t)));
      }
      context.lineTo(toX(t1), baseY);
      context.closePath();
      context.fill();
    }

    fillArea(0, right, medium);
    fillArea(0, left, pale);
    fillArea(left, right, band);

    if (showRiemann) {
      const n = 18;
      const dx = (right - left) / n;
      context.strokeStyle = style.getPropertyValue("--di-rect").trim() || "#92400e";
      context.lineWidth = 1;
      for (let i = 0; i < n; i += 1) {
        const x0 = left + i * dx;
        const mid = x0 + dx / 2;
        const rectH = baseY - toY(velocity(profile, mid));
        context.strokeRect(toX(x0), baseY - rectH, toX(x0 + dx) - toX(x0), rectH);
      }
    }

    context.strokeStyle = grid;
    context.lineWidth = 1;
    context.font = "12px system-ui, sans-serif";
    context.fillStyle = muted;
    for (let t = 0; t <= tMax; t += 1) {
      context.beginPath();
      context.moveTo(toX(t), pad.top);
      context.lineTo(toX(t), baseY);
      context.stroke();
      context.fillText(String(t), toX(t) - 4, baseY + 22);
    }
    for (let y = 0; y <= yMax; y += 20) {
      context.beginPath();
      context.moveTo(pad.left, toY(y));
      context.lineTo(width - pad.right, toY(y));
      context.stroke();
      context.fillText(String(y), 20, toY(y) + 4);
    }

    context.strokeStyle = fg;
    context.lineWidth = 1.5;
    context.beginPath();
    context.moveTo(pad.left, baseY);
    context.lineTo(width - pad.right, baseY);
    context.moveTo(pad.left, pad.top);
    context.lineTo(pad.left, baseY);
    context.stroke();

    context.strokeStyle = curve;
    context.lineWidth = 3;
    context.beginPath();
    points.forEach((point, index) => {
      const x = toX(point.t);
      const y = toY(point.v);
      if (index === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.stroke();

    for (const [t, label] of [[left, "a"], [right, "b"]] as const) {
      context.strokeStyle = fg;
      context.lineWidth = 2;
      context.setLineDash([5, 5]);
      context.beginPath();
      context.moveTo(toX(t), pad.top);
      context.lineTo(toX(t), baseY);
      context.stroke();
      context.setLineDash([]);
      context.fillStyle = fg;
      context.font = "700 13px system-ui, sans-serif";
      context.fillText(label, toX(t) - 4, pad.top + 14);
    }

    context.fillStyle = fg;
    context.font = "700 14px system-ui, sans-serif";
    context.fillText("Velocity v(t)", pad.left, 18);
    context.fillText("t", width - pad.right - 5, baseY + 38);
  }, [points, profile, left, right, showRiemann]);

  return (
    <section class="definite-integral-explorer" aria-label="Interactive definite integral explorer">
      <style>{`
        .definite-integral-explorer {
          --di-bg: #ffffff;
          --di-grid: #dde4ea;
          --di-fg: #1f2428;
          --di-muted: #647079;
          --di-curve: #16a34a;
          --di-pale: rgba(37, 99, 235, 0.14);
          --di-medium: rgba(37, 99, 235, 0.24);
          --di-band: rgba(220, 38, 38, 0.28);
          --di-rect: #92400e;
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
          background: var(--panel, #ffffff);
        }
        @media (prefers-color-scheme: dark) {
          .definite-integral-explorer {
            --di-bg: #1d2022;
            --di-grid: #343a40;
            --di-fg: #eef1f2;
            --di-muted: #aab3b9;
            --di-curve: #4ade80;
            --di-pale: rgba(96, 165, 250, 0.13);
            --di-medium: rgba(96, 165, 250, 0.23);
            --di-band: rgba(248, 113, 113, 0.28);
            --di-rect: #fbbf24;
          }
        }
        .definite-integral-explorer canvas {
          display: block;
          width: 100%;
          max-width: 760px;
          aspect-ratio: 760 / 420;
        }
        .definite-integral-explorer .controls {
          display: grid;
          gap: 12px;
        }
        .definite-integral-explorer .selector {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          border: 0;
          padding: 0;
          margin: 0;
        }
        .definite-integral-explorer .selector label,
        .definite-integral-explorer .control-row,
        .definite-integral-explorer .toggle,
        .definite-integral-explorer .readout {
          color: var(--fg, #1f2428);
          font: 600 0.95rem system-ui, sans-serif;
        }
        .definite-integral-explorer .selector span {
          display: inline-block;
          padding: 6px 10px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
        }
        .definite-integral-explorer .selector input:checked + span {
          border-color: var(--di-fg);
          background: color-mix(in srgb, var(--di-fg) 10%, transparent);
        }
        .definite-integral-explorer .control-row {
          display: grid;
          grid-template-columns: minmax(110px, max-content) 1fr;
          align-items: center;
          gap: 14px;
        }
        .definite-integral-explorer input[type="range"] { width: 100%; }
        .definite-integral-explorer .toggle {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .definite-integral-explorer .readout {
          display: flex;
          flex-wrap: wrap;
          gap: 10px 22px;
        }
        @media (max-width: 560px) {
          .definite-integral-explorer .control-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <div class="controls">
        <fieldset class="selector" aria-label="Velocity function">
          {(["constant", "linear", "quadratic"] as VelocityProfile[]).map((key) => (
            <label>
              <input
                type="radio"
                name="velocity-profile"
                checked={profile === key}
                onInput={() => setProfile(key)}
              />
              <span>{profileLabel(key)}</span>
            </label>
          ))}
        </fieldset>
        <label class="control-row">
          <span>a = {a.toFixed(2)}</span>
          <input type="range" min={0} max={tMax} step={0.01} value={a} onInput={(event) => setA(Number((event.currentTarget as HTMLInputElement).value))} />
        </label>
        <label class="control-row">
          <span>b = {b.toFixed(2)}</span>
          <input type="range" min={0} max={tMax} step={0.01} value={b} onInput={(event) => setB(Number((event.currentTarget as HTMLInputElement).value))} />
        </label>
        <label class="toggle">
          <input type="checkbox" checked={showRiemann} onInput={(event) => setShowRiemann((event.currentTarget as HTMLInputElement).checked)} />
          <span>Riemann rectangles</span>
        </label>
      </div>
      <canvas ref={canvasRef} width={width} height={height} />
      <div class="readout">
        <span>F(a) = {fmt(fa)}</span>
        <span>F(b) = {fmt(fb)}</span>
        <span>F(b) - F(a) = {fmt(fb - fa)}</span>
      </div>
    </section>
  );
}
