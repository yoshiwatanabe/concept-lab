/** Usage: <EmbeddingPlayground client:load /> */
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

type WordPoint = { word: string; x: number; y: number };

const WIDTH = 720;
const HEIGHT = 460;
const PAD = 54;
const RADIUS = 13;

const INITIAL: WordPoint[] = [
  { word: "犬", x: -0.78, y: 0.56 }, { word: "猫", x: -0.62, y: 0.62 }, { word: "鳥", x: -0.48, y: 0.48 },
  { word: "車", x: 0.52, y: -0.42 }, { word: "電車", x: 0.68, y: -0.28 }, { word: "自転車", x: 0.42, y: -0.62 },
  { word: "王", x: -0.18, y: 0.12 }, { word: "女王", x: -0.02, y: 0.48 }, { word: "男", x: -0.34, y: -0.18 }, { word: "女", x: -0.18, y: 0.18 },
  { word: "東京", x: 0.42, y: 0.48 }, { word: "大阪", x: 0.58, y: 0.38 }, { word: "京都", x: 0.62, y: 0.62 },
  { word: "ラーメン", x: -0.66, y: -0.48 }, { word: "寿司", x: -0.48, y: -0.64 }
];

function dot(a: WordPoint, b: WordPoint) { return a.x * b.x + a.y * b.y; }
function norm(a: WordPoint) { return Math.hypot(a.x, a.y); }
function cosine(a?: WordPoint, b?: WordPoint) {
  if (!a || !b) return null;
  const d = norm(a) * norm(b);
  return d < 1e-6 ? 0 : dot(a, b) / d;
}
function toPx(p: WordPoint) {
  return { x: PAD + ((p.x + 1) / 2) * (WIDTH - PAD * 2), y: PAD + ((1 - p.y) / 2) * (HEIGHT - PAD * 2) };
}
function fromPx(x: number, y: number) {
  return {
    x: Math.max(-1, Math.min(1, ((x - PAD) / (WIDTH - PAD * 2)) * 2 - 1)),
    y: Math.max(-1, Math.min(1, 1 - ((y - PAD) / (HEIGHT - PAD * 2)) * 2))
  };
}

export default function EmbeddingPlayground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState(INITIAL);
  const [selected, setSelected] = useState<string[]>(["犬", "猫"]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [showArithmetic, setShowArithmetic] = useState(true);

  const selectedPoints = useMemo(() => selected.map((w) => points.find((p) => p.word === w)), [points, selected]);
  const sim = cosine(selectedPoints[0], selectedPoints[1]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--emb-bg").trim() || "#fff";
    const fg = style.getPropertyValue("--emb-fg").trim() || "#202428";
    const grid = style.getPropertyValue("--emb-grid").trim() || "#d8dee4";
    const muted = style.getPropertyValue("--emb-muted").trim() || "#69737d";
    const accent = style.getPropertyValue("--emb-accent").trim() || "#0f766e";
    const warm = style.getPropertyValue("--emb-warm").trim() || "#c2410c";
    const violet = style.getPropertyValue("--emb-violet").trim() || "#6d28d9";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = grid;
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i += 0.5) {
      const x = toPx({ word: "", x: i, y: 0 }).x;
      const y = toPx({ word: "", x: 0, y: i }).y;
      ctx.beginPath(); ctx.moveTo(x, PAD); ctx.lineTo(x, HEIGHT - PAD); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(PAD, y); ctx.lineTo(WIDTH - PAD, y); ctx.stroke();
    }
    ctx.strokeStyle = muted;
    ctx.beginPath();
    ctx.moveTo(PAD, toPx({ word: "", x: 0, y: 0 }).y); ctx.lineTo(WIDTH - PAD, toPx({ word: "", x: 0, y: 0 }).y);
    ctx.moveTo(toPx({ word: "", x: 0, y: 0 }).x, PAD); ctx.lineTo(toPx({ word: "", x: 0, y: 0 }).x, HEIGHT - PAD);
    ctx.stroke();

    selectedPoints.forEach((p, i) => {
      if (!p) return;
      const end = toPx(p);
      const origin = toPx({ word: "", x: 0, y: 0 });
      ctx.strokeStyle = i === 0 ? accent : warm;
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(end.x, end.y); ctx.stroke();
    });

    if (showArithmetic) {
      const king = points.find((p) => p.word === "王")!;
      const man = points.find((p) => p.word === "男")!;
      const woman = points.find((p) => p.word === "女")!;
      const result = { word: "王 - 男 + 女", x: king.x - man.x + woman.x, y: king.y - man.y + woman.y };
      const a = toPx(king), b = toPx(result);
      ctx.strokeStyle = violet;
      ctx.setLineDash([8, 6]);
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = violet;
      ctx.beginPath(); ctx.arc(b.x, b.y, 8, 0, Math.PI * 2); ctx.fill();
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.fillText("king - man + woman", b.x + 10, b.y - 10);
    }

    for (const p of points) {
      const { x, y } = toPx(p);
      const active = selected.includes(p.word);
      ctx.fillStyle = active ? accent : bg;
      ctx.strokeStyle = active ? accent : fg;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath(); ctx.arc(x, y, RADIUS, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = active ? "#ffffff" : fg;
      ctx.font = "600 13px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.word, x, y + 4);
    }
    ctx.textAlign = "left";
    ctx.fillStyle = fg;
    ctx.font = "600 14px system-ui, sans-serif";
    ctx.fillText(`Cosine similarity: ${sim === null ? "select two words" : sim.toFixed(3)}`, PAD, 28);
  }, [points, selected, showArithmetic, sim, selectedPoints]);

  function eventPoint(event: PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((event.clientX - rect.left) / rect.width) * WIDTH, y: ((event.clientY - rect.top) / rect.height) * HEIGHT };
  }
  function hitWord(x: number, y: number) {
    return points.find((p) => Math.hypot(toPx(p).x - x, toPx(p).y - y) <= RADIUS + 7)?.word ?? null;
  }

  return (
    <section class="embedding-playground" aria-label="Word embedding playground">
      <style>{`
        .embedding-playground { --emb-bg:#fff; --emb-fg:#202428; --emb-grid:#d8dee4; --emb-muted:#69737d; --emb-accent:#0f766e; --emb-warm:#c2410c; --emb-violet:#6d28d9; display:grid; gap:12px; padding:16px; border:1px solid var(--line,#d9dee3); border-radius:8px; background:var(--panel,#fff); }
        @media (prefers-color-scheme: dark) { .embedding-playground { --emb-bg:#1d2022; --emb-fg:#eef1f2; --emb-grid:#343a40; --emb-muted:#aab3b9; --emb-accent:#5eead4; --emb-warm:#fb923c; --emb-violet:#c4b5fd; } }
        .embedding-playground canvas { display:block; width:100%; max-width:${WIDTH}px; aspect-ratio:${WIDTH}/${HEIGHT}; touch-action:none; }
        .embedding-playground__bar { display:flex; flex-wrap:wrap; gap:12px; align-items:center; font:600 .95rem system-ui,sans-serif; color:var(--fg,#202428); }
      `}</style>
      <canvas
        ref={canvasRef}
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={(event) => {
          const p = eventPoint(event as PointerEvent);
          const hit = hitWord(p.x, p.y);
          if (!hit) return;
          setDragging(hit);
          setSelected((old) => old.includes(hit) ? old : [...old.slice(-1), hit]);
          (event.currentTarget as HTMLCanvasElement).setPointerCapture((event as PointerEvent).pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragging) return;
          const p = eventPoint(event as PointerEvent);
          const next = fromPx(p.x, p.y);
          setPoints((old) => old.map((item) => item.word === dragging ? { ...item, ...next } : item));
        }}
        onPointerUp={() => setDragging(null)}
      />
      <div class="embedding-playground__bar">
        <span>Selected: {selected.join(" + ")}</span>
        <label><input type="checkbox" checked={showArithmetic} onInput={(e) => setShowArithmetic((e.currentTarget as HTMLInputElement).checked)} /> king - man + woman</label>
      </div>
    </section>
  );
}
