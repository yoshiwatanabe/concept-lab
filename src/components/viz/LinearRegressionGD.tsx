/** Usage: <LinearRegressionGD client:load /> */
import { useEffect, useRef, useState } from "preact/hooks";

const WIDTH = 720;
const HEIGHT = 430;
const PAD = 52;
const points = Array.from({ length: 18 }, (_, i) => {
  const x = 0.4 + i * 0.52;
  const noise = Math.sin(i * 2.17) * 0.55 + Math.cos(i * 0.9) * 0.25;
  return { x, y: 0.72 * x + 1.35 + noise };
});
const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
const mx = mean(points.map((p) => p.x)), my = mean(points.map((p) => p.y));
const closedA = points.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / points.reduce((s, p) => s + (p.x - mx) ** 2, 0);
const closedB = my - closedA * mx;
function mse(a: number, b: number) { return mean(points.map((p) => (a * p.x + b - p.y) ** 2)); }
function gradients(a: number, b: number) {
  return {
    da: (2 / points.length) * points.reduce((s, p) => s + (a * p.x + b - p.y) * p.x, 0),
    db: (2 / points.length) * points.reduce((s, p) => s + (a * p.x + b - p.y), 0)
  };
}
function map(v: number, a: number, b: number, c: number, d: number) { return c + ((v - a) / (b - a)) * (d - c); }
function toX(x: number) { return map(x, 0, 10, PAD, WIDTH - PAD - 180); }
function toY(y: number) { return map(y, 0, 10, HEIGHT - PAD, PAD); }

export default function LinearRegressionGD() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [a, setA] = useState(-0.35);
  const [b, setB] = useState(6.8);
  const [running, setRunning] = useState(true);
  const [showClosed, setShowClosed] = useState(true);
  const [history, setHistory] = useState<number[]>([mse(-0.35, 6.8)]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const g = gradients(a, b);
      const nextA = a - 0.006 * g.da;
      const nextB = b - 0.006 * g.db;
      setA(nextA);
      setB(nextB);
      setHistory((h) => [...h.slice(-59), mse(nextA, nextB)]);
    }, 90);
    return () => window.clearInterval(id);
  }, [running, a, b]);
  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr; canvas.height = HEIGHT * dpr; canvas.style.width = "100%"; canvas.style.height = "auto"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--lr-bg").trim() || "#fff", fg = style.getPropertyValue("--lr-fg").trim() || "#202428", grid = style.getPropertyValue("--lr-grid").trim() || "#d8dee4", line = style.getPropertyValue("--lr-line").trim() || "#0f766e", closed = style.getPropertyValue("--lr-closed").trim() || "#6d28d9", point = style.getPropertyValue("--lr-point").trim() || "#c2410c";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = grid; ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i += 2) { ctx.beginPath(); ctx.moveTo(toX(i), PAD); ctx.lineTo(toX(i), HEIGHT - PAD); ctx.stroke(); ctx.beginPath(); ctx.moveTo(PAD, toY(i)); ctx.lineTo(WIDTH - PAD - 180, toY(i)); ctx.stroke(); }
    ctx.strokeStyle = fg; ctx.beginPath(); ctx.moveTo(PAD, PAD); ctx.lineTo(PAD, HEIGHT - PAD); ctx.lineTo(WIDTH - PAD - 180, HEIGHT - PAD); ctx.stroke();
    ctx.fillStyle = point; for (const p of points) { ctx.beginPath(); ctx.arc(toX(p.x), toY(p.y), 4.5, 0, Math.PI * 2); ctx.fill(); }
    const drawLine = (aa: number, bb: number, color: string, dashed = false) => { ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash(dashed ? [8, 6] : []); ctx.beginPath(); ctx.moveTo(toX(0), toY(bb)); ctx.lineTo(toX(10), toY(aa * 10 + bb)); ctx.stroke(); ctx.setLineDash([]); };
    drawLine(a, b, line); if (showClosed) drawLine(closedA, closedB, closed, true);
    const sx = WIDTH - 170, sy = 70, sw = 120, sh = 210;
    ctx.strokeStyle = grid; ctx.strokeRect(sx, sy, sw, sh);
    const maxLoss = Math.max(1, ...history);
    ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.beginPath();
    history.forEach((v, i) => { const x = sx + (i / 59) * sw, y = sy + sh - (v / maxLoss) * sh; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }); ctx.stroke();
    ctx.fillStyle = fg; ctx.font = "600 13px system-ui,sans-serif"; ctx.fillText("MSE", sx, sy - 12); ctx.fillText(`a=${a.toFixed(2)} b=${b.toFixed(2)}`, sx, sy + sh + 26); ctx.fillText(`loss=${mse(a, b).toFixed(3)}`, sx, sy + sh + 46);
  }, [a, b, showClosed, history]);
  return (
    <section class="linear-regression-gd" aria-label="Linear regression gradient descent explorer">
      <style>{`.linear-regression-gd{--lr-bg:#fff;--lr-fg:#202428;--lr-grid:#d8dee4;--lr-line:#0f766e;--lr-closed:#6d28d9;--lr-point:#c2410c;display:grid;gap:12px;padding:16px;border:1px solid var(--line,#d9dee3);border-radius:8px;background:var(--panel,#fff)}@media(prefers-color-scheme:dark){.linear-regression-gd{--lr-bg:#1d2022;--lr-fg:#eef1f2;--lr-grid:#343a40;--lr-line:#5eead4;--lr-closed:#c4b5fd;--lr-point:#fb923c}}.linear-regression-gd canvas{display:block;width:100%;max-width:${WIDTH}px;aspect-ratio:${WIDTH}/${HEIGHT}}.linear-regression-gd__controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:600 .95rem system-ui,sans-serif;color:var(--fg,#202428)}`}</style>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} />
      <div class="linear-regression-gd__controls"><button type="button" onClick={() => setRunning(!running)}>{running ? "Pause" : "Auto"}</button><button type="button" onClick={() => { setA(-0.35); setB(6.8); setHistory([mse(-0.35, 6.8)]); }}>Reset</button><label><input type="checkbox" checked={showClosed} onInput={(e) => setShowClosed((e.currentTarget as HTMLInputElement).checked)} /> closed-form line</label></div>
    </section>
  );
}
