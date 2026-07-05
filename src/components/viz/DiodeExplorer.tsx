// Usage: <DiodeExplorer client:load /> — drag the diode voltage point and compare AC input with rectified output.
import { useEffect, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";

const width = 720;
const height = 430;

function css(canvas: HTMLCanvasElement, name: string, fallback: string) {
  return getComputedStyle(canvas).getPropertyValue(name).trim() || fallback;
}

function diodeCurrent(voltage: number) {
  if (voltage < -1.85) return -0.08 - Math.pow(Math.abs(voltage) - 1.85, 2) * 0.9;
  if (voltage < 0) return -0.015;
  return Math.min(1.2, 0.012 * (Math.exp(voltage / 0.09) - 1));
}

export default function DiodeExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(0.62);
  const [frequency, setFrequency] = useState(2);
  const [amplitude, setAmplitude] = useState(1);
  const [smoothing, setSmoothing] = useState(false);

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

    let raf = 0;
    const start = performance.now();
    const draw = (now: number) => {
      const bg = css(canvas, "--viz-bg", "#ffffff");
      const grid = css(canvas, "--viz-grid", "#d8dee4");
      const axis = css(canvas, "--viz-axis", "#1f2428");
      const line = css(canvas, "--viz-line", "#0f766e");
      const accent = css(canvas, "--viz-accent", "#e11d48");
      const secondary = css(canvas, "--viz-secondary", "#2563eb");
      const muted = css(canvas, "--viz-muted", "#647079");

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = "12px system-ui, sans-serif";

      const plot1 = { x: 48, y: 44, w: 280, h: 300 };
      const vxMin = -2;
      const vxMax = 1;
      const iyMin = -0.2;
      const iyMax = 1.2;
      const x1 = (v: number) => plot1.x + ((v - vxMin) / (vxMax - vxMin)) * plot1.w;
      const y1 = (i: number) => plot1.y + plot1.h - ((i - iyMin) / (iyMax - iyMin)) * plot1.h;

      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const x = plot1.x + (plot1.w * i) / 6;
        ctx.beginPath();
        ctx.moveTo(x, plot1.y);
        ctx.lineTo(x, plot1.y + plot1.h);
        ctx.stroke();
      }
      for (let i = 0; i <= 5; i++) {
        const y = plot1.y + (plot1.h * i) / 5;
        ctx.beginPath();
        ctx.moveTo(plot1.x, y);
        ctx.lineTo(plot1.x + plot1.w, y);
        ctx.stroke();
      }
      ctx.strokeStyle = axis;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(plot1.x, plot1.y, plot1.w, plot1.h);
      ctx.beginPath();
      ctx.moveTo(x1(0), plot1.y);
      ctx.lineTo(x1(0), plot1.y + plot1.h);
      ctx.moveTo(plot1.x, y1(0));
      ctx.lineTo(plot1.x + plot1.w, y1(0));
      ctx.stroke();
      ctx.fillStyle = axis;
      ctx.fillText("I-V curve", plot1.x, 24);
      ctx.fillText("Vd", plot1.x + plot1.w - 18, plot1.y + plot1.h + 26);
      ctx.fillText("Id", plot1.x + 8, plot1.y - 14);

      ctx.strokeStyle = line;
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let s = 0; s <= 240; s++) {
        const v = vxMin + ((vxMax - vxMin) * s) / 240;
        const i = diodeCurrent(v);
        if (s === 0) ctx.moveTo(x1(v), y1(i));
        else ctx.lineTo(x1(v), y1(i));
      }
      ctx.stroke();
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.arc(x1(voltage), y1(diodeCurrent(voltage)), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = muted;
      ctx.fillText("breakdown hinted", x1(-1.96), y1(-0.15));

      const plot2 = { x: 380, y: 44, w: 290, h: 300 };
      const x2 = (t: number) => plot2.x + t * plot2.w;
      const y2 = (v: number) => plot2.y + plot2.h / 2 - (v / 1.4) * (plot2.h / 2 - 18);
      ctx.strokeStyle = grid;
      ctx.lineWidth = 1;
      for (let i = 0; i <= 6; i++) {
        const x = plot2.x + (plot2.w * i) / 6;
        ctx.beginPath();
        ctx.moveTo(x, plot2.y);
        ctx.lineTo(x, plot2.y + plot2.h);
        ctx.stroke();
      }
      ctx.strokeStyle = axis;
      ctx.strokeRect(plot2.x, plot2.y, plot2.w, plot2.h);
      ctx.beginPath();
      ctx.moveTo(plot2.x, y2(0));
      ctx.lineTo(plot2.x + plot2.w, y2(0));
      ctx.stroke();
      ctx.fillStyle = axis;
      ctx.fillText("Half-wave rectifier", plot2.x, 24);

      const phase = ((now - start) / 1000) * frequency;
      let cap = 0;
      const drawWave = (rectified: boolean, color: string) => {
        ctx.strokeStyle = color;
        ctx.lineWidth = rectified ? 3 : 1.5;
        ctx.beginPath();
        for (let s = 0; s <= 280; s++) {
          const t = s / 280;
          const input = amplitude * Math.sin(2 * Math.PI * (frequency * t - phase * 0.12));
          let out = rectified ? Math.max(0, input - 0.18) : input;
          if (rectified && smoothing) {
            cap = Math.max(out, cap * 0.985);
            out = cap;
          }
          const x = x2(t);
          const y = y2(out);
          if (s === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      drawWave(false, secondary);
      drawWave(true, accent);
      ctx.fillStyle = secondary;
      ctx.fillText("AC input", plot2.x + 8, plot2.y + 18);
      ctx.fillStyle = accent;
      ctx.fillText(smoothing ? "Smoothed output" : "Rectified output", plot2.x + 8, plot2.y + 36);

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [voltage, frequency, amplitude, smoothing]);

  const handlePointer = (event: JSX.TargetedPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;
    if (x < 48 || x > 328) return;
    const next = -2 + ((x - 48) / 280) * 3;
    setVoltage(Math.max(-2, Math.min(1, next)));
  };

  const current = diodeCurrent(voltage);

  return (
    <section class="diode-explorer" aria-label="Interactive diode explorer">
      <style>{`
        .diode-explorer {
          --viz-bg: #ffffff;
          --viz-grid: #d8dee4;
          --viz-axis: #1f2428;
          --viz-line: #0f766e;
          --viz-accent: #e11d48;
          --viz-secondary: #2563eb;
          --viz-muted: #647079;
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
          background: var(--panel, #ffffff);
        }
        @media (prefers-color-scheme: dark) {
          .diode-explorer {
            --viz-bg: #1d2022;
            --viz-grid: #343a40;
            --viz-axis: #eef1f2;
            --viz-line: #5eead4;
            --viz-accent: #fb7185;
            --viz-secondary: #93c5fd;
            --viz-muted: #aab3b9;
          }
        }
        .diode-explorer canvas { display: block; width: 100%; max-width: 720px; aspect-ratio: 720 / 430; touch-action: none; }
        .diode-controls { display: grid; gap: 12px; }
        .diode-control { display: grid; grid-template-columns: minmax(160px, max-content) 1fr; gap: 14px; align-items: center; font: 600 0.95rem system-ui, sans-serif; color: var(--fg, #1f2428); }
        .diode-control input[type="range"] { width: 100%; }
        .diode-check { font: 600 0.95rem system-ui, sans-serif; color: var(--fg, #1f2428); }
        .diode-readout { font: 600 0.95rem system-ui, sans-serif; color: var(--fg, #1f2428); }
        @media (max-width: 560px) { .diode-control { grid-template-columns: 1fr; } }
      `}</style>
      <canvas ref={canvasRef} width={width} height={height} onPointerDown={handlePointer} onPointerMove={(e) => e.buttons === 1 && handlePointer(e)} />
      <div class="diode-controls">
        <label class="diode-control"><span>Operating V = {voltage.toFixed(2)} V</span><input type="range" min={-2} max={1} step={0.01} value={voltage} onInput={(e) => setVoltage(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <label class="diode-control"><span>AC frequency = {frequency.toFixed(1)} Hz</span><input type="range" min={0.5} max={6} step={0.1} value={frequency} onInput={(e) => setFrequency(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <label class="diode-control"><span>AC amplitude = {amplitude.toFixed(1)} V</span><input type="range" min={0.2} max={1.2} step={0.1} value={amplitude} onInput={(e) => setAmplitude(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <label class="diode-check"><input type="checkbox" checked={smoothing} onChange={(e) => setSmoothing((e.currentTarget as HTMLInputElement).checked)} /> Smoothing capacitor</label>
        <div class="diode-readout">Simplified diode current = {current.toFixed(3)} arb. units</div>
      </div>
    </section>
  );
}
