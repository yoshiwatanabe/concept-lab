// Usage: <ResistorNetwork client:load /> — compare two resistors in series and parallel with animated current dots.
import { useEffect, useRef, useState } from "preact/hooks";

const width = 720;
const height = 420;

type Mode = "series" | "parallel";

function css(canvas: HTMLCanvasElement, name: string, fallback: string) {
  return getComputedStyle(canvas).getPropertyValue(name).trim() || fallback;
}

function resistor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, label: string, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  const steps = 6;
  for (let i = 0; i < steps; i++) {
    const px = x + (w * (i + 0.5)) / steps;
    const py = y + (i % 2 === 0 ? -13 : 13);
    ctx.lineTo(px, py);
  }
  ctx.lineTo(x + w, y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.font = "13px system-ui, sans-serif";
  ctx.fillText(label, x + w / 2 - 18, y - 24);
}

function dot(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, radius: number) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export default function ResistorNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [voltage, setVoltage] = useState(6);
  const [r1, setR1] = useState(220);
  const [r2, setR2] = useState(470);
  const [mode, setMode] = useState<Mode>("series");

  const totalR = mode === "series" ? r1 + r2 : 1 / (1 / r1 + 1 / r2);
  const totalI = voltage / totalR;
  const seriesV1 = totalI * r1;
  const seriesV2 = totalI * r2;
  const branchI1 = voltage / r1;
  const branchI2 = voltage / r2;

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

    let frame = 0;
    let raf = 0;
    const drawWire = (points: Array<[number, number]>, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
    };

    const animate = () => {
      frame += 1;
      const bg = css(canvas, "--viz-bg", "#ffffff");
      const axis = css(canvas, "--viz-axis", "#1f2428");
      const muted = css(canvas, "--viz-muted", "#647079");
      const currentColor = css(canvas, "--viz-current", "#0f766e");
      const branchColor = css(canvas, "--viz-branch", "#2563eb");
      const accent = css(canvas, "--viz-accent", "#e11d48");

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);
      ctx.font = "13px system-ui, sans-serif";
      ctx.fillStyle = muted;
      ctx.fillText("Current dots speed and density follow current magnitude.", 28, 30);

      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(85, 155);
      ctx.lineTo(85, 265);
      ctx.stroke();
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(68, 185);
      ctx.lineTo(102, 185);
      ctx.moveTo(74, 235);
      ctx.lineTo(96, 235);
      ctx.stroke();
      ctx.fillStyle = axis;
      ctx.fillText(`${voltage.toFixed(1)} V`, 55, 145);

      if (mode === "series") {
        drawWire(
          [
            [85, 155],
            [180, 155],
            [500, 155],
            [620, 155],
            [620, 265],
            [85, 265],
            [85, 155]
          ],
          axis
        );
        resistor(ctx, 190, 155, 120, "R1", axis);
        resistor(ctx, 350, 155, 120, "R2", axis);
        const speed = Math.min(9, 2 + totalI * 600);
        const count = Math.max(5, Math.min(22, Math.round(totalI * 1800)));
        for (let i = 0; i < count; i++) {
          const p = ((frame * speed + (i * 720) / count) % 720) / 720;
          let x = 85;
          let y = 155;
          if (p < 0.55) {
            x = 85 + p / 0.55 * 535;
            y = 155;
          } else if (p < 0.7) {
            x = 620;
            y = 155 + ((p - 0.55) / 0.15) * 110;
          } else {
            x = 620 - ((p - 0.7) / 0.3) * 535;
            y = 265;
          }
          dot(ctx, x, y, currentColor, 4);
        }
      } else {
        drawWire(
          [
            [85, 155],
            [180, 155],
            [180, 105],
            [560, 105],
            [560, 155],
            [620, 155],
            [620, 265],
            [560, 265],
            [560, 315],
            [180, 315],
            [180, 265],
            [85, 265],
            [85, 155]
          ],
          axis
        );
        drawWire(
          [
            [180, 155],
            [180, 105],
            [560, 105],
            [560, 155]
          ],
          axis
        );
        drawWire(
          [
            [180, 265],
            [180, 315],
            [560, 315],
            [560, 265]
          ],
          axis
        );
        resistor(ctx, 285, 105, 130, "R1", axis);
        resistor(ctx, 285, 315, 130, "R2", axis);
        const drawBranchDots = (y: number, amps: number, color: string, offset: number) => {
          const speed = Math.min(10, 2 + amps * 700);
          const count = Math.max(3, Math.min(18, Math.round(amps * 1400)));
          for (let i = 0; i < count; i++) {
            const p = ((frame * speed + offset + (i * 380) / count) % 380) / 380;
            dot(ctx, 180 + p * 380, y, color, 3.8);
          }
        };
        drawBranchDots(105, branchI1, currentColor, 0);
        drawBranchDots(315, branchI2, branchColor, 80);
      }

      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, [voltage, r1, r2, mode, totalI, branchI1, branchI2]);

  return (
    <section class="resistor-network" aria-label="Interactive resistor network">
      <style>{`
        .resistor-network {
          --viz-bg: #ffffff;
          --viz-axis: #1f2428;
          --viz-muted: #647079;
          --viz-current: #0f766e;
          --viz-branch: #2563eb;
          --viz-accent: #e11d48;
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
          background: var(--panel, #ffffff);
        }
        @media (prefers-color-scheme: dark) {
          .resistor-network {
            --viz-bg: #1d2022;
            --viz-axis: #eef1f2;
            --viz-muted: #aab3b9;
            --viz-current: #5eead4;
            --viz-branch: #93c5fd;
            --viz-accent: #fb7185;
          }
        }
        .resistor-network canvas { display: block; width: 100%; max-width: 720px; aspect-ratio: 720 / 420; }
        .rn-controls { display: grid; gap: 12px; }
        .rn-control { display: grid; grid-template-columns: minmax(130px, max-content) 1fr; gap: 14px; align-items: center; font: 600 0.95rem system-ui, sans-serif; color: var(--fg, #1f2428); }
        .rn-control input[type="range"] { width: 100%; }
        .rn-toggle { display: flex; flex-wrap: wrap; gap: 8px; }
        .rn-toggle button { border: 1px solid var(--line, #d9dee3); border-radius: 8px; padding: 8px 12px; background: transparent; color: var(--fg, #1f2428); font: inherit; cursor: pointer; }
        .rn-toggle button[aria-pressed="true"] { background: var(--fg, #1f2428); color: var(--bg, #ffffff); }
        .rn-readout { display: grid; gap: 4px; font: 600 0.95rem system-ui, sans-serif; color: var(--fg, #1f2428); }
        @media (max-width: 560px) { .rn-control { grid-template-columns: 1fr; } }
      `}</style>
      <canvas ref={canvasRef} width={width} height={height} />
      <div class="rn-controls">
        <div class="rn-toggle" role="group" aria-label="Circuit mode">
          <button type="button" aria-pressed={mode === "series"} onClick={() => setMode("series")}>Series</button>
          <button type="button" aria-pressed={mode === "parallel"} onClick={() => setMode("parallel")}>Parallel</button>
        </div>
        <label class="rn-control"><span>Voltage = {voltage.toFixed(1)} V</span><input type="range" min={1} max={12} step={0.1} value={voltage} onInput={(e) => setVoltage(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <label class="rn-control"><span>R1 = {r1.toFixed(0)} Ohm</span><input type="range" min={10} max={1000} step={10} value={r1} onInput={(e) => setR1(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <label class="rn-control"><span>R2 = {r2.toFixed(0)} Ohm</span><input type="range" min={10} max={1000} step={10} value={r2} onInput={(e) => setR2(Number((e.currentTarget as HTMLInputElement).value))} /></label>
        <div class="rn-readout">
          <span>Total R = {totalR.toFixed(1)} Ohm</span>
          <span>Total I = {(totalI * 1000).toFixed(2)} mA</span>
          {mode === "series" ? (
            <span>Voltage drops: R1 {seriesV1.toFixed(2)} V, R2 {seriesV2.toFixed(2)} V</span>
          ) : (
            <span>Branch currents: R1 {(branchI1 * 1000).toFixed(2)} mA, R2 {(branchI2 * 1000).toFixed(2)} mA</span>
          )}
        </div>
      </div>
    </section>
  );
}
