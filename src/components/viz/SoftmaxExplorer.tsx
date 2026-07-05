/** Usage: <SoftmaxExplorer client:load /> */
import { useEffect, useRef, useState } from "preact/hooks";

const WIDTH = 700;
const HEIGHT = 430;
const PAD = 48;
const labels = ["猫", "犬", "魚", "車", "本", "月"];
const initial = [2.2, 1.4, 0.7, -0.6, 0.2, -1.1];

function softmax(logits: number[], t: number) {
  const scaled = logits.map((v) => v / t);
  const max = Math.max(...scaled);
  const exps = scaled.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / sum);
}

export default function SoftmaxExplorer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [logits, setLogits] = useState(initial);
  const [temperature, setTemperature] = useState(1);
  const [drag, setDrag] = useState<number | null>(null);
  const probs = softmax(logits, temperature);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr; canvas.height = HEIGHT * dpr; canvas.style.width = "100%"; canvas.style.height = "auto"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--sx-bg").trim() || "#fff", fg = style.getPropertyValue("--sx-fg").trim() || "#202428", grid = style.getPropertyValue("--sx-grid").trim() || "#d8dee4", logitColor = style.getPropertyValue("--sx-logit").trim() || "#0f766e", probColor = style.getPropertyValue("--sx-prob").trim() || "#c2410c";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.font = "600 13px system-ui,sans-serif"; ctx.fillStyle = fg;
    ctx.fillText("Logits (drag bars)", PAD, 26); ctx.fillText("Softmax probabilities", PAD, HEIGHT / 2 + 34);
    const barW = (WIDTH - PAD * 2) / labels.length - 16;
    const zeroY = 180;
    ctx.strokeStyle = grid; ctx.beginPath(); ctx.moveTo(PAD, zeroY); ctx.lineTo(WIDTH - PAD, zeroY); ctx.stroke();
    labels.forEach((label, i) => {
      const x = PAD + i * ((WIDTH - PAD * 2) / labels.length) + 8;
      const h = logits[i] * 32;
      ctx.fillStyle = logitColor; ctx.fillRect(x, h >= 0 ? zeroY - h : zeroY, barW, Math.abs(h));
      ctx.fillStyle = fg; ctx.textAlign = "center"; ctx.fillText(label, x + barW / 2, 208); ctx.fillText(logits[i].toFixed(1), x + barW / 2, h >= 0 ? zeroY - h - 8 : zeroY + Math.abs(h) + 16);
      const ph = probs[i] * 130;
      ctx.fillStyle = probColor; ctx.fillRect(x, HEIGHT - PAD - ph, barW, ph);
      ctx.fillStyle = fg; ctx.fillText(`${(probs[i] * 100).toFixed(0)}%`, x + barW / 2, HEIGHT - PAD - ph - 8);
    });
    ctx.textAlign = "left";
  }, [logits, temperature, probs]);

  function pointerToLogit(event: PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const y = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    const slot = Math.floor((x - PAD) / ((WIDTH - PAD * 2) / labels.length));
    return { slot, value: Math.max(-3, Math.min(3, (180 - y) / 32)) };
  }

  return (
    <section class="softmax-explorer" aria-label="Softmax temperature explorer">
      <style>{`
        .softmax-explorer{--sx-bg:#fff;--sx-fg:#202428;--sx-grid:#d8dee4;--sx-logit:#0f766e;--sx-prob:#c2410c;display:grid;gap:12px;padding:16px;border:1px solid var(--line,#d9dee3);border-radius:8px;background:var(--panel,#fff)}
        @media(prefers-color-scheme:dark){.softmax-explorer{--sx-bg:#1d2022;--sx-fg:#eef1f2;--sx-grid:#343a40;--sx-logit:#5eead4;--sx-prob:#fb923c}}
        .softmax-explorer canvas{display:block;width:100%;max-width:${WIDTH}px;aspect-ratio:${WIDTH}/${HEIGHT};touch-action:none}.softmax-explorer label{display:grid;grid-template-columns:160px 1fr;gap:12px;align-items:center;font:600 .95rem system-ui,sans-serif;color:var(--fg,#202428)}.softmax-explorer input{width:100%}@media(max-width:540px){.softmax-explorer label{grid-template-columns:1fr}}
      `}</style>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={(event) => { const p = pointerToLogit(event as PointerEvent); if (p.slot >= 0 && p.slot < labels.length) setDrag(p.slot); }}
        onPointerMove={(event) => { if (drag === null) return; const p = pointerToLogit(event as PointerEvent); setLogits((old) => old.map((v, i) => i === drag ? p.value : v)); }}
        onPointerUp={() => setDrag(null)}
      />
      <label>Temperature T = {temperature.toFixed(2)}<input type="range" min="0.1" max="3" step="0.05" value={temperature} onInput={(e) => setTemperature(Number((e.currentTarget as HTMLInputElement).value))} /></label>
    </section>
  );
}
