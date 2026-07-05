/** Usage: <NextTokenDemo client:load /> */
import { useMemo, useState } from "preact/hooks";

const WIDTH = 700;
const HEIGHT = 360;
const corpus = "むかしむかしあるところにおじいさんとおばあさんがいました。むかしある村に小さな猫がいました。";
const chars = Array.from(new Set([...corpus]));
function countsFor(context: string) {
  const key = context.slice(-2);
  const one = context.slice(-1);
  const counts = new Map<string, number>();
  for (let i = 0; i < corpus.length - 1; i += 1) {
    const c2 = corpus.slice(i, i + 2);
    const c1 = corpus[i];
    if ((key.length === 2 && c2 === key) || (key.length < 2 && c1 === one)) {
      const next = corpus[i + (key.length === 2 ? 2 : 1)];
      if (next) counts.set(next, (counts.get(next) ?? 0) + 1);
    }
  }
  if (counts.size === 0) chars.forEach((c) => counts.set(c, 1));
  return counts;
}
function distribution(context: string, temperature: number) {
  const counts = countsFor(context);
  const entries = [...counts.entries()].slice(0, 10);
  const logits = entries.map(([, c]) => Math.log(c + 0.2) / temperature);
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return entries.map(([char], i) => ({ char, p: exps[i] / sum })).sort((a, b) => b.p - a.p);
}
function sample(dist: { char: string; p: number }[]) {
  let r = Math.random();
  for (const item of dist) { r -= item.p; if (r <= 0) return item.char; }
  return dist[dist.length - 1].char;
}

export default function NextTokenDemo() {
  const [text, setText] = useState("むかし");
  const [temperature, setTemperature] = useState(1);
  const dist = useMemo(() => distribution(text, temperature), [text, temperature]);
  const canvas = (node: HTMLCanvasElement | null) => {
    if (!node) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    node.width = WIDTH * dpr; node.height = HEIGHT * dpr; node.style.width = "100%"; node.style.height = "auto"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const style = getComputedStyle(node);
    const bg = style.getPropertyValue("--nt-bg").trim() || "#fff", fg = style.getPropertyValue("--nt-fg").trim() || "#202428", grid = style.getPropertyValue("--nt-grid").trim() || "#d8dee4", accent = style.getPropertyValue("--nt-accent").trim() || "#0f766e";
    ctx.fillStyle = bg; ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = fg; ctx.font = "600 16px system-ui,sans-serif"; ctx.fillText(`Context: ${text.slice(-16)}`, 42, 42); ctx.font = "600 13px system-ui,sans-serif"; ctx.fillText("Next character probabilities", 42, 82);
    const max = Math.max(...dist.map((d) => d.p), 0.01);
    dist.forEach((d, i) => {
      const y = 112 + i * 22, w = (d.p / max) * 460;
      ctx.fillStyle = grid; ctx.fillRect(78, y - 13, 470, 16);
      ctx.fillStyle = accent; ctx.fillRect(78, y - 13, w, 16);
      ctx.fillStyle = fg; ctx.textAlign = "right"; ctx.fillText(d.char, 64, y); ctx.textAlign = "left"; ctx.fillText(`${(d.p * 100).toFixed(1)}%`, 560, y);
    });
    ctx.textAlign = "left";
  };
  const addOne = () => setText((old) => old + sample(distribution(old, temperature)));
  const auto = () => { let next = text; for (let i = 0; i < 20; i += 1) next += sample(distribution(next, temperature)); setText(next); };
  return (
    <section class="next-token-demo" aria-label="Next token prediction demo">
      <style>{`.next-token-demo{--nt-bg:#fff;--nt-fg:#202428;--nt-grid:#d8dee4;--nt-accent:#0f766e;display:grid;gap:12px;padding:16px;border:1px solid var(--line,#d9dee3);border-radius:8px;background:var(--panel,#fff)}@media(prefers-color-scheme:dark){.next-token-demo{--nt-bg:#1d2022;--nt-fg:#eef1f2;--nt-grid:#343a40;--nt-accent:#5eead4}}.next-token-demo canvas{display:block;width:100%;max-width:${WIDTH}px;aspect-ratio:${WIDTH}/${HEIGHT}}.next-token-demo__controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;font:600 .95rem system-ui,sans-serif;color:var(--fg,#202428)}.next-token-demo input[type=range]{width:170px}.next-token-demo input[type=text]{min-width:220px}`}</style>
      <canvas ref={canvas} width={WIDTH} height={HEIGHT} />
      <div class="next-token-demo__controls"><input type="text" value={text} onInput={(e) => setText((e.currentTarget as HTMLInputElement).value)} aria-label="context text" /><button type="button" onClick={addOne}>Sample one</button><button type="button" onClick={auto}>Generate 20</button><button type="button" onClick={() => setText("むかし")}>Reset</button><label>T {temperature.toFixed(2)} <input type="range" min="0.2" max="2.5" step="0.05" value={temperature} onInput={(e) => setTemperature(Number((e.currentTarget as HTMLInputElement).value))} /></label></div>
    </section>
  );
}
