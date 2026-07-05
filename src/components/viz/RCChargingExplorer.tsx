// Usage: <RCChargingExplorer client:load /> — explore RC charge and discharge curves with the tau point marked.
import { useEffect, useRef, useState } from "preact/hooks";

const width = 720;
const height = 420;
const padding = 48;

type Mode = "charge" | "discharge";

function css(canvas: HTMLCanvasElement, name: string, fallback: string) {
  return getComputedStyle(canvas).getPropertyValue(name).trim() || fallback;
}

export default function RCChargingExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [resistance, setResistance] = useState(100);
  const [capacitance, setCapacitance] = useState(1000);
  const [mode, setMode] = useState<Mode>("charge");
  const tau = (resistance * capacitance) / 1000;
  const maxT = Math.max(1, tau * 5);
  const cursorT = tau;
  const cursorPct = mode === "charge" ? 1 - Math.exp(-cursorT / tau) : Math.exp(-cursorT / tau);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let start = performance.now();
    let raf = 0;
    const toX = (t: number) => padding + (t / maxT) * (width - padding * 2);
    const toY = (v: number) => height - padding - v * (height - padding * 2);

    const draw = (now: number) => {
      const elapsed = ((now - start) / 1000) % maxT;
      const bg = css(canvas, "--viz-bg", "#ffffff");
      const grid = css(canvas, "--viz-grid", "#d8dee4");
      const axis = css(canvas, "--viz-axis", "#1f2428");
      const line = css(canvas, "--viz-line", "#0f766e");
      const accent = css(canvas, "--viz-accent", "#e11d48");
      const muted = css(canvas, "--viz-muted", "#647079");

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      ctx.font = "12px system-ui, sans-serif";
      ctx.fillStyle = muted;
      for (let i = 0; i <= 5; i++) {
        const x = toX((maxT * i) / 5);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
        ctx.fillText(`${((maxT * i) / 5).toFixed(1)}s`, x - 12, height - padding + 20);
      }
      for (let i = 0; i <= 4; i++) {
        const v = i / 4;
        const y = toY(v);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
        ctx.fillText(`${Math.round(v * 100)}%`, 10, y + 4);
      }

      ctx.strokeStyle = axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, height - padding);
      ctx.lineTo(width - padding, height - padding);
      ctx.stroke();
      ctx.fillStyle = axis;
      ctx.fillText("time", width - padding - 20, height - padding + 36);
      ctx.fillText("Vc", padding + 8, padding - 18);

      ctx.strokeStyle = muted;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      const asymptote = mode === "charge" ? toY(1) : toY(0);
      ctx.moveTo(padding, asymptote);
      ctx.lineTo(width - padding, asymptote);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      const samples = 220;
      for (let i = 0; i <= samples; i++) {
        const t = (elapsed * i) / samples;
        const v = mode === "charge" ? 1 - Math.exp(-t / tau) : Math.exp(-t / tau);
        const x = toX(t);
        const y = toY(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = accent;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toX(tau), padding);
      ctx.lineTo(toX(tau), height - padding);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = accent;
      ctx.fillText("tau = RC", toX(tau) + 8, padding + 18);

      const currentValue = mode === "charge" ? 1 - Math.exp(-elapsed / tau) : Math.exp(-elapsed / tau);
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(toX(elapsed), toY(currentValue), 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = axis;
      ctx.lineWidth = 3;
      ctx.strokeRect(88, 72, 64, 48);
      ctx.fillStyle = axis;
      ctx.fillText("Battery", 96, 102);
      ctx.beginPath();
      ctx.moveTo(152, 96);
      ctx.lineTo(245, 96);
      ctx.moveTo(245, 86);
      ctx.lineTo(275, 106);
      ctx.moveTo(245, 106);
      ctx.lineTo(275, 86);
      ctx.moveTo(275, 96);
      ctx.lineTo(345, 96);
      ctx.stroke();
      ctx.fillText("R", 250, 75);
      ctx.beginPath();
      ctx.moveTo(345, 70);
      ctx.lineTo(345, 122);
      ctx.moveTo(365, 70);
      ctx.lineTo(365, 122);
      ctx.stroke();
      ctx.fillText("C", 374, 100);

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [resistance, capacitance, mode, tau, maxT]);

  return (
    <section class="rc-explorer" aria-label="Interactive RC charging explorer">
      <style>{`
        .rc-explorer {
          --viz-bg: #ffffff;
          --viz-grid: #d8dee4;
          --viz-axis: #1f2428;
          --viz-line: #0f766e;
          --viz-accent: #e11d48;
          --viz-muted: #647079;
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
          background: var(--panel, #ffffff);
        }
        @media (prefers-color-scheme: dark) {
          .rc-explorer {
            --viz-bg: #1d2022;
            --viz-grid: #343a40;
            --viz-axis: #eef1f2;
            --viz-line: #5eead4;
            --viz-accent: #fb7185;
            --viz-muted: #aab3b9;
          }
        }
        .rc-explorer canvas { display: block; width: 100%; max-width: 720px; aspect-ratio: 720 / 420; }
        .rc-controls { display: grid; gap: 12px; }
        .rc-control { display: grid; grid-template-columns: minmax(150px, max-content) 1fr; gap: 14px; align-items: center; font: 600 0.95rem system-ui, sans-serif; color: var(--fg, #1f2428); }
        .rc-control input[type="range"] { width: 100%; }
        .rc-toggle { display: flex; flex-wrap: wrap; gap: 8px; }
        .rc-toggle button { border: 1px solid var(--line, #d9dee3); border-radius: 8px; padding: 8px 12px; background: transparent; color: var(--fg, #1f2428); font: inherit; cursor: pointer; }
        .rc-toggle button[aria-pressed="true"] { background: var(--fg, #1f2428); color: var(--bg, #ffffff); }
        .rc-readout { font: 600 0.95rem system-ui, sans-serif; color: var(--fg, #1f2428); }
        @media (max-width: 560px) { .rc-control { grid-template-columns: 1fr; } }
      `}</style>
      <canvas ref={canvasRef} width={width} height={height} />
      <div class="rc-controls">
        <div class="rc-toggle" role="group" aria-label="Charge mode">
          <button type="button" aria-pressed={mode === "charge"} onClick={() => setMode("charge")}>Charge</button>
          <button type="button" aria-pressed={mode === "discharge"} onClick={() => setMode("discharge")}>Discharge</button>
        </div>
        <label class="rc-control"><span>R = {resistance.toFixed(0)} kOhm</span><input type="range" min={10} max={1000} step={10} value={resistance} onInput={(e) => setResistance(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <label class="rc-control"><span>C = {capacitance.toFixed(0)} uF</span><input type="range" min={100} max={5000} step={100} value={capacitance} onInput={(e) => setCapacitance(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <div class="rc-readout">tau = RC = {tau.toFixed(2)} s; at tau, Vc is {(cursorPct * 100).toFixed(1)}% of the starting-to-ending change.</div>
      </div>
    </section>
  );
}
