// Usage: <PowerRuleGeometry client:load />
import { useEffect, useRef, useState } from "preact/hooks";

const squareSize = 420;

function fmt(value: number) {
  return value.toFixed(3);
}

export default function PowerRuleGeometry() {
  const squareRef = useRef<HTMLCanvasElement>(null);
  const cubeRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"square" | "cube">("square");
  const [x, setX] = useState(2);
  const [dx, setDx] = useState(0.25);

  const squareMain = x * x;
  const squareStrips = 2 * x * dx;
  const squareCorner = dx * dx;
  const squareIncrease = squareStrips + squareCorner;
  const squareCornerPct = (squareCorner / squareIncrease) * 100;

  const cubeFaces = 3 * x * x * dx;
  const cubeEdges = 3 * x * dx * dx;
  const cubeCorner = dx * dx * dx;
  const cubeIncrease = cubeFaces + cubeEdges + cubeCorner;
  const cubeRemainderPct = ((cubeEdges + cubeCorner) / cubeIncrease) * 100;

  useEffect(() => {
    const canvas = squareRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = squareSize * dpr;
    canvas.height = squareSize * dpr;
    canvas.style.width = "100%";
    canvas.style.height = "auto";
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const style = getComputedStyle(canvas);
    const bg = style.getPropertyValue("--pr-bg").trim() || "#ffffff";
    const fg = style.getPropertyValue("--pr-fg").trim() || "#1f2428";
    const base = style.getPropertyValue("--pr-base").trim() || "#dbeafe";
    const strip = style.getPropertyValue("--pr-strip").trim() || "#22c55e";
    const corner = style.getPropertyValue("--pr-corner").trim() || "#f97316";
    const line = style.getPropertyValue("--pr-line").trim() || "#1f2428";

    context.fillStyle = bg;
    context.fillRect(0, 0, squareSize, squareSize);

    const margin = 52;
    const scale = (squareSize - margin * 2) / (x + dx);
    const originX = margin;
    const originY = squareSize - margin;
    const main = x * scale;
    const delta = dx * scale;

    context.fillStyle = base;
    context.fillRect(originX, originY - main, main, main);
    context.fillStyle = strip;
    context.globalAlpha = 0.82;
    context.fillRect(originX + main, originY - main, delta, main);
    context.fillRect(originX, originY - main - delta, main, delta);
    context.globalAlpha = 1;
    context.fillStyle = corner;
    context.fillRect(originX + main, originY - main - delta, delta, delta);

    context.strokeStyle = line;
    context.lineWidth = 2;
    context.strokeRect(originX, originY - main, main, main);
    context.strokeRect(originX + main, originY - main, delta, main);
    context.strokeRect(originX, originY - main - delta, main, delta);
    context.strokeRect(originX + main, originY - main - delta, delta, delta);

    context.fillStyle = fg;
    context.font = "700 14px system-ui, sans-serif";
    context.fillText("x", originX + main / 2 - 5, originY + 24);
    context.fillText("Δx", originX + main + delta / 2 - 10, originY + 24);
    context.save();
    context.translate(originX - 25, originY - main / 2 + 5);
    context.rotate(-Math.PI / 2);
    context.fillText("x", 0, 0);
    context.restore();
    context.save();
    context.translate(originX - 25, originY - main - delta / 2 + 10);
    context.rotate(-Math.PI / 2);
    context.fillText("Δx", 0, 0);
    context.restore();
  }, [x, dx]);

  useEffect(() => {
    const container = cubeRef.current;
    if (!container) return;
    let disposed = false;
    let frame = 0;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      if (disposed || !container) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(getComputedStyle(container).getPropertyValue("--pr-bg").trim() || "#ffffff");
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      camera.position.set(4.8, 4.2, 5.8);
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(window.devicePixelRatio || 1);
      renderer.setSize(container.clientWidth || 420, container.clientWidth || 420);
      container.innerHTML = "";
      container.appendChild(renderer.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.7;

      const lights = [
        new THREE.AmbientLight(0xffffff, 1.6),
        new THREE.DirectionalLight(0xffffff, 2.4)
      ];
      lights[1].position.set(4, 6, 5);
      lights.forEach((light) => scene.add(light));

      const materials = [
        new THREE.MeshStandardMaterial({ color: 0x93c5fd, transparent: true, opacity: 0.68 }),
        new THREE.MeshStandardMaterial({ color: 0x22c55e, transparent: true, opacity: 0.72 }),
        new THREE.MeshStandardMaterial({ color: 0xf97316, transparent: true, opacity: 0.72 })
      ];
      const geometries: any[] = [];
      const meshes: any[] = [];
      const addBox = (sx: number, sy: number, sz: number, px: number, py: number, pz: number, material: any) => {
        const geometry = new THREE.BoxGeometry(sx, sy, sz);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(px, py, pz);
        scene.add(mesh);
        geometries.push(geometry);
        meshes.push(mesh);
      };

      addBox(x, x, x, 0, 0, 0, materials[0]);
      addBox(dx, x, x, x / 2 + dx / 2, 0, 0, materials[1]);
      addBox(x, dx, x, 0, x / 2 + dx / 2, 0, materials[1]);
      addBox(x, x, dx, 0, 0, x / 2 + dx / 2, materials[1]);
      addBox(dx, dx, x + dx, x / 2 + dx / 2, x / 2 + dx / 2, dx / 2, materials[2]);
      addBox(dx, x, dx, x / 2 + dx / 2, 0, x / 2 + dx / 2, materials[2]);
      addBox(x, dx, dx, 0, x / 2 + dx / 2, x / 2 + dx / 2, materials[2]);

      const edges = new THREE.Box3().setFromObject(new THREE.Group());
      void edges;
      const resize = () => {
        const size = Math.max(280, container.clientWidth || 420);
        renderer.setSize(size, size);
        camera.aspect = 1;
        camera.updateProjectionMatrix();
      };
      const observer = new ResizeObserver(resize);
      observer.observe(container);
      resize();

      const animate = () => {
        controls.update();
        renderer.render(scene, camera);
        frame = requestAnimationFrame(animate);
      };
      animate();

      cleanup = () => {
        cancelAnimationFrame(frame);
        observer.disconnect();
        controls.dispose();
        meshes.forEach((mesh) => scene.remove(mesh));
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((material) => material.dispose());
        renderer.dispose();
        renderer.domElement.remove();
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [x, dx]);

  return (
    <section class="power-rule-geometry" aria-label="Interactive power rule geometry">
      <style>{`
        .power-rule-geometry {
          --pr-bg: #ffffff;
          --pr-fg: #1f2428;
          --pr-muted: #647079;
          --pr-line: #1f2428;
          --pr-base: #dbeafe;
          --pr-strip: #22c55e;
          --pr-corner: #f97316;
          display: grid;
          gap: 14px;
          padding: 16px;
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
          background: var(--panel, #ffffff);
        }
        @media (prefers-color-scheme: dark) {
          .power-rule-geometry {
            --pr-bg: #1d2022;
            --pr-fg: #eef1f2;
            --pr-muted: #aab3b9;
            --pr-line: #eef1f2;
            --pr-base: #1d4ed8;
            --pr-strip: #4ade80;
            --pr-corner: #fb923c;
          }
        }
        .power-rule-geometry .tabs,
        .power-rule-geometry .readout {
          display: flex;
          flex-wrap: wrap;
          gap: 8px 18px;
          color: var(--fg, #1f2428);
          font: 600 0.95rem system-ui, sans-serif;
        }
        .power-rule-geometry button {
          border: 1px solid var(--line, #d9dee3);
          border-radius: 8px;
          padding: 7px 12px;
          background: transparent;
          color: var(--fg, #1f2428);
          font: inherit;
        }
        .power-rule-geometry button[aria-pressed="true"] {
          border-color: var(--pr-fg);
          background: color-mix(in srgb, var(--pr-fg) 10%, transparent);
        }
        .power-rule-geometry .control-row {
          display: grid;
          grid-template-columns: minmax(95px, max-content) 1fr;
          align-items: center;
          gap: 14px;
          color: var(--fg, #1f2428);
          font: 600 0.95rem system-ui, sans-serif;
        }
        .power-rule-geometry input[type="range"] { width: 100%; }
        .power-rule-geometry canvas,
        .power-rule-geometry .cube-stage {
          width: 100%;
          max-width: 520px;
          aspect-ratio: 1;
          display: block;
        }
        .power-rule-geometry .cube-stage canvas { max-width: none; }
        @media (max-width: 560px) {
          .power-rule-geometry .control-row { grid-template-columns: 1fr; }
        }
      `}</style>
      <div class="tabs" role="tablist" aria-label="Power rule geometry view">
        <button type="button" aria-pressed={mode === "square"} onClick={() => setMode("square")}>Square x²</button>
        <button type="button" aria-pressed={mode === "cube"} onClick={() => setMode("cube")}>Cube x³</button>
      </div>
      <label class="control-row">
        <span>x = {x.toFixed(2)}</span>
        <input type="range" min={1} max={3.5} step={0.01} value={x} onInput={(event) => setX(Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
      <label class="control-row">
        <span>Δx = {dx.toFixed(2)}</span>
        <input type="range" min={0.02} max={0.8} step={0.01} value={dx} onInput={(event) => setDx(Number((event.currentTarget as HTMLInputElement).value))} />
      </label>
      {mode === "square" ? (
        <>
          <canvas ref={squareRef} width={squareSize} height={squareSize} />
          <div class="readout">
            <span>ΔA = 2x·Δx + Δx² = {fmt(squareStrips)} + {fmt(squareCorner)}</span>
            <span>corner = {squareCornerPct.toFixed(1)}%</span>
          </div>
        </>
      ) : (
        <>
          <div class="cube-stage" ref={cubeRef} />
          <div class="readout">
            <span>ΔV = 3x²·Δx + edges + corner = {fmt(cubeFaces)} + {fmt(cubeEdges)} + {fmt(cubeCorner)}</span>
            <span>higher-order terms = {cubeRemainderPct.toFixed(1)}%</span>
          </div>
        </>
      )}
    </section>
  );
}
