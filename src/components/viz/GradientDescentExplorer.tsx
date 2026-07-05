/** Usage: <GradientDescentExplorer client:load /> */
import { useEffect, useRef, useState } from "preact/hooks";

const WIDTH = 720;
const HEIGHT = 420;
const PAD = 52;

function loss(w: number) { return 0.08 * (w + 3.2) ** 2 + 0.05 * (w - 1.3) ** 4 - 0.62 * Math.exp(-((w + 2.2) ** 2) / 0.65) - 0.95 * Math.exp(-((w - 1.4) ** 2) / 0.9) + 2.2; }
function slope(w: number) { const h = 0.001; return (loss(w + h) - loss(w - h)) / (2 * h); }
const X_MIN = -4;
const X_MAX = 4;
const samples = Array.from({ length: 500 }, (_, i) => X_MIN + (i / 499) * (X_MAX - X_MIN));
const Y_MIN = Math.min(...samples.map(loss)) - 0.25;
const Y_MAX = Math.max(...samples.map(loss)) + 0.35;
function map(v: number, a: number, b: number, c: number, d: number) { return c + ((v - a) / (b - a)) * (d - c); }
function toX(w: number) { return map(w, X_MIN, X_MAX, PAD, WIDTH - PAD); }
function toY(y: number) { return map(y, Y_MIN, Y_MAX, HEIGHT - PAD, PAD); }

export default function GradientDescentExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [w, setW] = useState(-3.55);
  const [lr, setLr] = useState(0.18);
  const [path, setPath] = useState([-3.55]);
  const [running, setRunning] = useState(false);
  const currentSlope = slope(w);
  const stepSize = -lr * currentSlope;

  const step = () => setW((old) => {
    const next = Math.max(X_MIN, Math.min(X_MAX, old - lr * slope(old)));
    setPath((p) => [...p.slice(-59), next]);
    return next;
  });

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(step, 450);
    return () => window.clearInterval(id);
  }, [running, lr]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr; canvas.height = HEIGHT * dpr; canvas.style.width = "100%"; canvas.style.height = "auto"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--gd-bg").trim() || "#fff", fg = style.getPropertyValue("--gd-fg").trim() || "#202428", grid = style.getPropertyValue("--gd-grid").trim() || "#d8dee4", curve = style.getPropertyValue("--gd-curve").trim() || "#0f766e", accent = style.getPropertyValue("--gd-accent").trim() || "#c2410c", trail = style.getPropertyValue("--gd-trail").trim() || "#6d28d9";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = grid; ctx.lineWidth = 1; ctx.font = "12px system-ui,sans-serif"; ctx.fillStyle = fg;
    for (let x = -4; x <= 4; x += 1) { ctx.beginPath(); ctx.moveTo(toX(x), PAD); ctx.lineTo(toX(x), HEIGHT - PAD); ctx.stroke(); ctx.fillText(String(x), toX(x) - 5, HEIGHT - 25); }
    for (let y = 0; y <= 5; y += 1) { ctx.beginPath(); ctx.moveTo(PAD, toY(y)); ctx.lineTo(WIDTH - PAD, toY(y)); ctx.stroke(); ctx.fillText(String(y), 18, toY(y) + 4); }
    ctx.strokeStyle = curve; ctx.lineWidth = 3; ctx.beginPath();
    samples.forEach((x, i) => { const px = toX(x), py = toY(loss(x)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.stroke();
    ctx.strokeStyle = trail; ctx.lineWidth = 2; ctx.beginPath();
    path.forEach((x, i) => { const px = toX(x), py = toY(loss(x)); if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }); ctx.stroke();
    for (const x of path) { ctx.fillStyle = trail; ctx.globalAlpha = 0.25; ctx.beginPath(); ctx.arc(toX(x), toY(loss(x)), 4, 0, Math.PI * 2); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.fillStyle = accent; ctx.beginPath(); ctx.arc(toX(w), toY(loss(w)), 9, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = fg; ctx.font = "600 14px system-ui,sans-serif"; ctx.fillText("Click curve to move the ball. High LR can overshoot.", PAD, 28);
  }, [w, path]);

  return (
    <section class="gradient-descent" aria-label="Gradient descent explorer">
      <style>{`
        .gradient-descent{--gd-bg:#fff;--gd-fg:#202428;--gd-grid:#d8dee4;--gd-curve:#0f766e;--gd-accent:#c2410c;--gd-trail:#6d28d9;display:grid;gap:12px;padding:16px;border:1px solid var(--line,#d9dee3);border-radius:8px;background:var(--panel,#fff)}
        @media(prefers-color-scheme:dark){.gradient-descent{--gd-bg:#1d2022;--gd-fg:#eef1f2;--gd-grid:#343a40;--gd-curve:#5eead4;--gd-accent:#fb923c;--gd-trail:#c4b5fd}}
        .gradient-descent canvas{display:block;width:100%;max-width:${WIDTH}px;aspect-ratio:${WIDTH}/${HEIGHT};touch-action:none}.gradient-descent__controls{display:grid;grid-template-columns:repeat(4,max-content) 1fr;gap:12px;align-items:center;font:600 .92rem system-ui,sans-serif;color:var(--fg,#202428)}.gradient-descent input{width:100%}@media(max-width:680px){.gradient-descent__controls{grid-template-columns:1fr}}
      `}</style>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} onPointerDown={(event) => { const r = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect(); const x = ((event.clientX - r.left) / r.width) * WIDTH; const next = map(x, PAD, WIDTH - PAD, X_MIN, X_MAX); setW(next); setPath([next]); }} />
      <div class="gradient-descent__controls">
        <button type="button" onClick={step}>Step</button><button type="button" onClick={() => setRunning(!running)}>{running ? "Pause" : "Auto"}</button><button type="button" onClick={() => { setW(-3.55); setPath([-3.55]); }}>Reset</button>
        <span>w {w.toFixed(2)} | f(w) {loss(w).toFixed(2)} | slope {currentSlope.toFixed(2)} | step {stepSize.toFixed(2)}</span>
        <label>learning rate {lr.toFixed(2)} <input type="range" min="0.02" max="1.05" step="0.01" value={lr} onInput={(e) => setLr(Number((e.currentTarget as HTMLInputElement).value))} /></label>
      </div>
    </section>
  );
}
