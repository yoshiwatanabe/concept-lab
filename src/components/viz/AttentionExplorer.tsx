/** Usage: <AttentionExplorer client:load /> */
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

const WIDTH = 740;
const HEIGHT = 470;
const tokens = ["猫", "が", "魚", "を", "食べた"];
const Q = [[0.9, 0.2, 0.1, 0.0], [0.1, 0.6, 0.1, 0.0], [0.2, 0.1, 0.8, 0.1], [0.0, 0.4, 0.1, 0.2], [0.8, 0.0, 0.9, 0.3]];
const K = [[1.0, 0.1, 0.0, 0.0], [0.0, 0.5, 0.1, 0.0], [0.1, 0.0, 1.0, 0.1], [0.0, 0.4, 0.1, 0.2], [0.4, 0.1, 0.5, 0.8]];
const V = [[0.8, 0.2, 0.1, 0.0], [0.1, 0.3, 0.2, 0.1], [0.1, 0.1, 0.9, 0.2], [0.0, 0.2, 0.2, 0.3], [0.5, 0.1, 0.6, 0.9]];
const scale = 1 / Math.sqrt(4);
function dot(a: number[], b: number[]) { return a.reduce((s, v, i) => s + v * b[i], 0); }
function softmax(vals: number[], t: number) { const m = Math.max(...vals); const e = vals.map((v) => Math.exp((v - m) / t)); const s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); }
function weightsFor(i: number, temp: number) { return softmax(tokens.map((_, j) => dot(Q[i], K[j]) * scale), temp); }
function weightedV(w: number[]) { return V[0].map((_, d) => w.reduce((s, v, i) => s + v * V[i][d], 0)); }

export default function AttentionExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(4);
  const [temperature, setTemperature] = useState(1);
  const [heatmap, setHeatmap] = useState(false);
  const scores = useMemo(() => tokens.map((_, j) => dot(Q[selected], K[j]) * scale), [selected]);
  const weights = useMemo(() => weightsFor(selected, temperature), [selected, temperature]);
  const out = useMemo(() => weightedV(weights), [weights]);

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr; canvas.height = HEIGHT * dpr; canvas.style.width = "100%"; canvas.style.height = "auto"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--att-bg").trim() || "#fff", fg = style.getPropertyValue("--att-fg").trim() || "#202428", grid = style.getPropertyValue("--att-grid").trim() || "#d8dee4", accent = style.getPropertyValue("--att-accent").trim() || "#0f766e", warm = style.getPropertyValue("--att-warm").trim() || "#c2410c";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "600 15px system-ui,sans-serif"; ctx.textAlign = "center";
    tokens.forEach((tok, i) => {
      const x = 95 + i * 130;
      ctx.fillStyle = i === selected ? accent : bg; ctx.strokeStyle = i === selected ? accent : fg; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x - 38, 26, 76, 36, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = i === selected ? "#fff" : fg; ctx.fillText(tok, x, 49);
    });
    if (heatmap) {
      ctx.fillStyle = fg; ctx.textAlign = "left"; ctx.fillText("Full attention heatmap", 70, 100);
      const cell = 52, ox = 230, oy = 115;
      ctx.textAlign = "center"; tokens.forEach((t, i) => { ctx.fillText(t, ox + i * cell + cell / 2, oy - 12); ctx.fillText(t, ox - 24, oy + i * cell + 32); });
      for (let r = 0; r < tokens.length; r += 1) for (let c = 0; c < tokens.length; c += 1) {
        const w = weightsFor(r, temperature)[c];
        ctx.fillStyle = `rgba(15,118,110,${0.12 + w * 0.88})`; ctx.fillRect(ox + c * cell, oy + r * cell, cell - 3, cell - 3);
        ctx.fillStyle = fg; ctx.font = "11px system-ui,sans-serif"; ctx.fillText(w.toFixed(2), ox + c * cell + cell / 2, oy + r * cell + 31);
      }
      return;
    }
    const barBase = 245, barTop = 95, slot = 116, start = 70;
    ctx.textAlign = "left"; ctx.fillStyle = fg; ctx.font = "600 14px system-ui,sans-serif"; ctx.fillText("Q dot K scores", 70, 96); ctx.fillText("softmax weights", 70, 292); ctx.fillText(`weighted V output = [${out.map((v) => v.toFixed(2)).join(", ")}]`, 70, 420);
    tokens.forEach((tok, i) => {
      const x = start + i * slot;
      const scoreH = Math.max(4, scores[i] * 95);
      ctx.fillStyle = warm; ctx.fillRect(x, barBase - scoreH, 42, scoreH);
      ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.fillText(tok, x + 21, barBase + 20); ctx.fillText(scores[i].toFixed(2), x + 21, barBase - scoreH - 8);
      const wh = weights[i] * 120;
      ctx.fillStyle = accent; ctx.globalAlpha = 0.22 + weights[i] * 0.78; ctx.fillRect(x + 58, 380 - wh, 42, wh); ctx.globalAlpha = 1;
      ctx.fillStyle = fg; ctx.fillText(weights[i].toFixed(2), x + 79, 380 - wh - 8);
    });
    ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(60, barBase); ctx.lineTo(WIDTH - 70, barBase); ctx.moveTo(60, 380); ctx.lineTo(WIDTH - 70, 380); ctx.stroke();
  }, [selected, temperature, heatmap, scores, weights, out]);

  return (
    <section class="attention-explorer" aria-label="Attention mechanism explorer">
      <style>{`.attention-explorer{--att-bg:#fff;--att-fg:#202428;--att-grid:#d8dee4;--att-accent:#0f766e;--att-warm:#c2410c;display:grid;gap:12px;padding:16px;border:1px solid var(--line,#d9dee3);border-radius:8px;background:var(--panel,#fff)}@media(prefers-color-scheme:dark){.attention-explorer{--att-bg:#1d2022;--att-fg:#eef1f2;--att-grid:#343a40;--att-accent:#5eead4;--att-warm:#fb923c}}.attention-explorer canvas{display:block;width:100%;max-width:${WIDTH}px;aspect-ratio:${WIDTH}/${HEIGHT};touch-action:none}.attention-explorer__controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:600 .95rem system-ui,sans-serif;color:var(--fg,#202428)}.attention-explorer input[type=range]{width:180px}`}</style>
      <canvas ref={canvasRef} width={WIDTH} height={HEIGHT} onPointerDown={(event) => { const r = (event.currentTarget as HTMLCanvasElement).getBoundingClientRect(); const x = ((event.clientX - r.left) / r.width) * WIDTH; const y = ((event.clientY - r.top) / r.height) * HEIGHT; if (y >= 26 && y <= 62) { const idx = Math.round((x - 95) / 130); if (idx >= 0 && idx < tokens.length) setSelected(idx); } }} />
      <div class="attention-explorer__controls"><span>Query token: {tokens[selected]}</span><label>temperature {temperature.toFixed(2)} <input type="range" min="0.35" max="2" step="0.05" value={temperature} onInput={(e) => setTemperature(Number((e.currentTarget as HTMLInputElement).value))} /></label><label><input type="checkbox" checked={heatmap} onInput={(e) => setHeatmap((e.currentTarget as HTMLInputElement).checked)} /> full 5x5 heatmap</label><span>scale = 1/sqrt(d)</span></div>
    </section>
  );
}
