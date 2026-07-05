import { useEffect, useMemo, useRef, useState } from "preact/hooks";
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type SimulationLinkDatum,
  type SimulationNodeDatum
} from "d3-force";

type ConceptStatus = "stub" | "draft" | "migrated" | "polished";

export interface GraphConcept {
  id: string;
  slug: string;
  title_ja: string;
  title_en: string;
  domain: string;
  status: ConceptStatus;
  prerequisites: string[];
  related: string[];
  level: number;
}

interface GraphViewProps {
  concepts: GraphConcept[];
  baseUrl: string;
}

interface NodeDatum extends SimulationNodeDatum, GraphConcept {}

interface LinkDatum extends SimulationLinkDatum<NodeDatum> {
  id: string;
  kind: "prerequisite" | "related";
  source: string | NodeDatum;
  target: string | NodeDatum;
}

const WIDTH = 1200;
const HEIGHT = 760;
const DOMAIN_COLORS: Record<string, string> = {
  math: "#0f766e",
  stats: "#b45309",
  ml: "#2563eb",
  physics: "#7c3aed",
  electricity: "#ca8a04",
  language: "#be123c"
};

const domainLabel = (domain: string) => domain.charAt(0).toUpperCase() + domain.slice(1);

const linkPoint = (value: string | NodeDatum): NodeDatum => value as NodeDatum;

export default function GraphView({ concepts, baseUrl }: GraphViewProps) {
  const [nodes, setNodes] = useState<NodeDatum[]>([]);
  const [links, setLinks] = useState<LinkDatum[]>([]);
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const svgRef = useRef<SVGSVGElement>(null);
  const panRef = useRef<{ x: number; y: number; startX: number; startY: number } | null>(null);
  const dragRef = useRef<{ id: string; moved: boolean } | null>(null);

  const domains = useMemo(
    () => Array.from(new Set(concepts.map((concept) => concept.domain))).sort(),
    [concepts]
  );

  useEffect(() => {
    const domainIndex = new Map(domains.map((domain, index) => [domain, index]));
    const nextNodes: NodeDatum[] = concepts.map((concept, index) => {
      const angle = (2 * Math.PI * (domainIndex.get(concept.domain) ?? 0)) / Math.max(domains.length, 1);
      const radius = 120 + concept.level * 46;
      return {
        ...concept,
        x: WIDTH / 2 + Math.cos(angle) * radius + (index % 5) * 12,
        y: HEIGHT / 2 + Math.sin(angle) * radius + (index % 7) * 9
      };
    });
    const byId = new Map(nextNodes.map((node) => [node.id, node]));
    const seenRelated = new Set<string>();
    const nextLinks: LinkDatum[] = [];

    for (const concept of concepts) {
      for (const prerequisite of concept.prerequisites) {
        if (byId.has(prerequisite)) {
          nextLinks.push({
            id: `prereq:${prerequisite}->${concept.id}`,
            kind: "prerequisite",
            source: prerequisite,
            target: concept.id
          });
        }
      }

      for (const related of concept.related) {
        if (!byId.has(related)) continue;
        const pair = [concept.id, related].sort().join("--");
        if (seenRelated.has(pair)) continue;
        seenRelated.add(pair);
        nextLinks.push({
          id: `related:${pair}`,
          kind: "related",
          source: concept.id,
          target: related
        });
      }
    }

    let frame = 0;
    const simulation = forceSimulation<NodeDatum>(nextNodes)
      .force(
        "link",
        forceLink<NodeDatum, LinkDatum>(nextLinks)
          .id((node) => node.id)
          .distance((link) => (link.kind === "prerequisite" ? 112 : 82))
          .strength((link) => (link.kind === "prerequisite" ? 0.55 : 0.18))
      )
      .force("charge", forceManyBody().strength(-360))
      .force("collide", forceCollide<NodeDatum>().radius(48).strength(0.9))
      .force("center", forceCenter(WIDTH / 2, HEIGHT / 2))
      .force("x", forceX<NodeDatum>((node) => 160 + (node.level - 1) * 220).strength(0.08))
      .force(
        "y",
        forceY<NodeDatum>((node) => {
          const index = domainIndex.get(node.domain) ?? 0;
          return 110 + (index + 0.5) * (HEIGHT - 220) / Math.max(domains.length, 1);
        }).strength(0.06)
      )
      .on("tick", () => {
        if (frame) return;
        frame = window.requestAnimationFrame(() => {
          frame = 0;
          setNodes([...nextNodes]);
          setLinks([...nextLinks]);
        });
      });

    setNodes(nextNodes);
    setLinks(nextLinks);

    return () => {
      simulation.stop();
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [concepts, domains]);

  const screenToWorld = (event: PointerEvent | WheelEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const sx = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const sy = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    return {
      x: (sx - transform.x) / transform.k,
      y: (sy - transform.y) / transform.k
    };
  };

  const onWheel = (event: WheelEvent) => {
    event.preventDefault();
    const before = screenToWorld(event);
    const nextK = Math.min(2.6, Math.max(0.45, transform.k * (event.deltaY > 0 ? 0.9 : 1.1)));
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const sx = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const sy = ((event.clientY - rect.top) / rect.height) * HEIGHT;
    setTransform({
      k: nextK,
      x: sx - before.x * nextK,
      y: sy - before.y * nextK
    });
  };

  const beginPan = (event: PointerEvent) => {
    if (event.button !== 0) return;
    panRef.current = { x: event.clientX, y: event.clientY, startX: transform.x, startY: transform.y };
    svgRef.current?.setPointerCapture(event.pointerId);
  };

  const movePan = (event: PointerEvent) => {
    if (!panRef.current) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTransform((current) => ({
      ...current,
      x: panRef.current!.startX + ((event.clientX - panRef.current!.x) / rect.width) * WIDTH,
      y: panRef.current!.startY + ((event.clientY - panRef.current!.y) / rect.height) * HEIGHT
    }));
  };

  const endPan = (event: PointerEvent) => {
    panRef.current = null;
    svgRef.current?.releasePointerCapture(event.pointerId);
  };

  const beginNodeDrag = (event: PointerEvent, node: NodeDatum) => {
    event.stopPropagation();
    dragRef.current = { id: node.id, moved: false };
    (event.currentTarget as SVGElement).setPointerCapture(event.pointerId);
  };

  const moveNode = (event: PointerEvent, node: NodeDatum) => {
    if (dragRef.current?.id !== node.id) return;
    event.preventDefault();
    const point = screenToWorld(event);
    dragRef.current.moved = true;
    node.fx = point.x;
    node.fy = point.y;
    node.x = point.x;
    node.y = point.y;
    setNodes((current) => [...current]);
  };

  const endNodeDrag = (event: PointerEvent, node: NodeDatum) => {
    if (dragRef.current?.id !== node.id) return;
    const moved = dragRef.current.moved;
    dragRef.current = null;
    node.fx = null;
    node.fy = null;
    (event.currentTarget as SVGElement).releasePointerCapture(event.pointerId);
    if (!moved && node.status !== "stub") {
      window.location.href = `${baseUrl}concepts/${node.slug}/`;
    }
  };

  return (
    <div class="graph-view">
      <div class="graph-toolbar" aria-label="Graph legend">
        {domains.map((domain) => (
          <span class="legend-item" key={domain}>
            <span class="legend-swatch" style={{ background: DOMAIN_COLORS[domain] ?? "var(--accent)" }} />
            {domainLabel(domain)}
          </span>
        ))}
        <span class="legend-rule">solid = migrated/polished</span>
        <span class="legend-rule">hollow = stub</span>
      </div>

      <svg
        ref={svgRef}
        class="graph-canvas"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="Knowledge graph of concept prerequisites and related concepts"
        onWheel={onWheel}
        onPointerDown={beginPan}
        onPointerMove={movePan}
        onPointerUp={endPan}
        onPointerCancel={endPan}
      >
        <defs>
          <marker id="graph-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" />
          </marker>
        </defs>
        <rect class="graph-bg" width={WIDTH} height={HEIGHT} />
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
          <g class="links">
            {links.map((link) => {
              const source = linkPoint(link.source);
              const target = linkPoint(link.target);
              return (
                <line
                  key={link.id}
                  class={link.kind === "related" ? "link related" : "link prerequisite"}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  marker-end={link.kind === "prerequisite" ? "url(#graph-arrow)" : undefined}
                />
              );
            })}
          </g>
          <g class="nodes">
            {nodes.map((node) => {
              const color = DOMAIN_COLORS[node.domain] ?? "var(--accent)";
              const isStub = node.status === "stub";
              return (
                <g
                  key={node.id}
                  class={`node ${isStub ? "is-stub" : "is-open"}`}
                  transform={`translate(${node.x ?? WIDTH / 2} ${node.y ?? HEIGHT / 2})`}
                  onPointerDown={(event) => beginNodeDrag(event, node)}
                  onPointerMove={(event) => moveNode(event, node)}
                  onPointerUp={(event) => endNodeDrag(event, node)}
                  onPointerCancel={(event) => endNodeDrag(event, node)}
                >
                  <title>{`${node.title_ja} / ${node.title_en}`}</title>
                  <circle
                    r={isStub ? 24 : 26}
                    fill={isStub ? "var(--bg)" : color}
                    stroke={color}
                    stroke-width={isStub ? 3 : 2}
                    stroke-dasharray={isStub ? "6 4" : undefined}
                  />
                  <text class="node-title" y="-32">
                    {node.title_ja}
                  </text>
                  <text class="node-subtitle" y="-16">
                    {node.title_en}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
