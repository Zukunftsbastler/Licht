import React, { useMemo, useState, useCallback, useRef } from "react";
import { metaNodes } from "@/skillTree/metaTree.js";
import {
  getVisibleNodes,
  getNodeCost,
  canBuy,
  getLevel,
  indexById,
} from "@/skillTree/engine.js";

const HEX_W = 90; // tighter horizontal spacing
const HEX_V = Math.round(HEX_W * 0.866); // vertical spacing for hex grid (sqrt(3)/2)
const MARGIN = 60; // outer margin

function primaryTag(node) {
  if (!node.tags || node.tags.length === 0) return "utility";
  // Prefer keystone styling if tagged
  if (node.tags.includes("keystone")) return "keystone";
  return node.tags[0];
}

function tagColors(tag) {
  // Color coding by type
  switch (tag) {
    case "offense":
      return {
        border: "border-amber-400",
        bg: "bg-amber-900/40",
        ring: "ring-amber-400/40",
        icon: "text-amber-300",
        edge: "#f59e0b",
      };
    case "defense":
      return {
        border: "border-emerald-400",
        bg: "bg-emerald-900/40",
        ring: "ring-emerald-400/40",
        icon: "text-emerald-300",
        edge: "#34d399",
      };
    case "economy":
      return {
        border: "border-amber-300",
        bg: "bg-amber-800/30",
        ring: "ring-amber-300/30",
        icon: "text-amber-200",
        edge: "#fbbf24",
      };
    case "keystone":
      return {
        border: "border-fuchsia-400",
        bg: "bg-fuchsia-900/40",
        ring: "ring-fuchsia-400/40",
        icon: "text-fuchsia-300",
        edge: "#e879f9",
      };
    case "utility":
    default:
      return {
        border: "border-cyan-400",
        bg: "bg-cyan-900/40",
        ring: "ring-cyan-400/40",
        icon: "text-cyan-300",
        edge: "#22d3ee",
      };
  }
}

function computeBounds(nodes) {
  // Axial-to-pixel mapping for pointy-top hexes with shared walls
  // Using size s = HEX_W/2
  const s = HEX_W / 2;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  nodes.forEach((n) => {
    const p = n.position || { x: 0, y: 0 };
    const xPx = (Math.sqrt(3) * s) * (p.x + p.y / 2);
    const yPx = (1.5 * s) * p.y;
    if (xPx < minX) minX = xPx;
    if (xPx > maxX) maxX = xPx;
    if (yPx < minY) minY = yPx;
    if (yPx > maxY) maxY = yPx;
  });

  if (!isFinite(minX)) { minX = 0; maxX = 0; minY = 0; maxY = 0; }

  const width = (maxX - minX) + MARGIN * 2 + HEX_V;
  const height = (maxY - minY) + MARGIN * 2 + HEX_W;
  const offsetX = MARGIN + -minX;
  const offsetY = MARGIN + -minY;
  return { width, height, offsetX, offsetY };
}

const NodeTooltip = ({ node, level, maxLevel, nextCost, check, affordable }) => {
  return (
    <div className="pointer-events-none absolute z-50 -top-2 left-16 bg-gray-900/95 border border-gray-700 rounded p-3 text-left w-64 shadow-lg">
      <div className="text-cyan-300 font-semibold mb-1">{node.name}</div>
      <div className="text-xs text-gray-300 mb-2">{node.desc}</div>
      <div className="flex justify-between text-xs">
        <span className="text-yellow-300">Stufe {level}/{maxLevel}</span>
        {level < maxLevel && (
          <span className={`${affordable ? "text-cyan-300" : "text-gray-400"}`}>
            Kosten: {nextCost}
          </span>
        )}
      </div>
      {!check.ok && level < maxLevel && (
        <div className="text-[11px] text-red-400 mt-1">
          {check.reason || "Gesperrt"}
        </div>
      )}
    </div>
  );
};

const SkillTreeGraph = ({
  totalLightSparks,
  metaProgress,
  metaStats,
  onBuyMetaNode,
}) => {
  const ctx = useMemo(
    () => ({
      totalLightSparks,
      totalSparksSpent: metaStats?.totalSparksSpent || 0,
      achievements: metaStats?.achievements || [],
    }),
    [totalLightSparks, metaStats]
  );

  const nodeIndex = useMemo(() => indexById(metaNodes), []);
  const allWithPos = useMemo(
    () => metaNodes.map((n) => ({ ...n, position: n.position || { x: 0, y: 0 } })),
    []
  );

  // Reveal logic: which nodes are currently visible in the fog-of-war sense
  const visible = useMemo(
    () => getVisibleNodes(metaNodes, metaProgress, ctx),
    [metaProgress, ctx]
  );

  const visibleIndex = useMemo(() => {
    const s = new Set(visible.map((n) => n.id));
    return s;
  }, [visible]);

  // Bounds for the canvas/SVG
  const bounds = useMemo(() => computeBounds(allWithPos), [allWithPos]);

  const toPx = useCallback(
    (p) => {
      const s = HEX_W / 2;
      const x = bounds.offsetX + (Math.sqrt(3) * s) * (p.x + p.y / 2);
      const y = bounds.offsetY + (1.5 * s) * p.y;
      return { x, y };
    },
    [bounds]
  );

  // Build edges: prereqs and neighborOf relations between visible nodes
  const edges = useMemo(() => {
    /** @type {{from: string, to: string, x1: number, y1: number, x2: number, y2: number, color: string}[]} */
    const list = [];

    const addEdge = (fromId, toId, color) => {
      const a = nodeIndex[fromId];
      const b = nodeIndex[toId];
      if (!a || !b) return;
      const A = toPx(a.position || { x: 0, y: 0 });
      const B = toPx(b.position || { x: 0, y: 0 });
      list.push({ from: fromId, to: toId, x1: A.x, y1: A.y, x2: B.x, y2: B.y, color });
    };

    visible.forEach((n) => {
      const col = tagColors(primaryTag(n)).edge;
      if (n.prereqs && n.prereqs.length > 0) {
        n.prereqs.forEach((pid) => {
          if (nodeIndex[pid] && visibleIndex.has(pid)) addEdge(pid, n.id, col);
        });
      }
      if (n.reveal && n.reveal.neighborOf) {
        n.reveal.neighborOf.forEach((nid) => {
          if (nodeIndex[nid] && visibleIndex.has(nid)) addEdge(nid, n.id, col);
        });
      }
    });

    return list;
  }, [visible, visibleIndex, nodeIndex, toPx]);

  const [hoverId, setHoverId] = useState(null);
  // Pan/Zoom state
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.9);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const dragRef = useRef({ dragging: false, startX: 0, startY: 0, origX: 0, origY: 0 });

  const clampScale = (s) => Math.min(2, Math.max(0.6, s));

  const handleWheel = useCallback((e) => {
    // Zoom with Ctrl/Cmd (pinch), pan horizontally with Shift+Wheel
    setHoverId(null);
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      const mx = rect ? e.clientX - rect.left : 0;
      const my = rect ? e.clientY - rect.top : 0;
      const beforeX = (mx - panX) / scale;
      const beforeY = (my - panY) / scale;
      const delta = -e.deltaY * 0.0015;
      const newScale = clampScale(scale * (1 + delta));
      const afterX = beforeX * newScale;
      const afterY = beforeY * newScale;
      setScale(newScale);
      setPanX(mx - afterX);
      setPanY(my - afterY);
    } else if (e.shiftKey) {
      e.preventDefault();
      setPanX((x) => x - e.deltaY * 0.8);
    }
    // otherwise allow normal vertical scroll in parent
  }, [scale, panX, panY]);

  const onPointerDown = useCallback((e) => {
    dragRef.current = {
      dragging: true,
      startX: e.clientX,
      startY: e.clientY,
      origX: panX,
      origY: panY,
    };
    // Hide any tooltip when starting to drag/pan
    setHoverId(null);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  }, [panX, panY]);

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current.dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPanX(dragRef.current.origX + dx);
    setPanY(dragRef.current.origY + dy);
  }, []);

  const endDrag = useCallback((e) => {
    if (dragRef.current.dragging) {
      dragRef.current.dragging = false;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
    // Also clear any tooltip when leaving or ending interaction
    setHoverId(null);
  }, []);

  const zoomBy = useCallback((factor) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const mx = rect ? rect.width / 2 : 0;
    const my = rect ? rect.height / 2 : 0;
    const beforeX = (mx - panX) / scale;
    const beforeY = (my - panY) / scale;
    const newScale = clampScale(scale * factor);
    const afterX = beforeX * newScale;
    const afterY = beforeY * newScale;
    setScale(newScale);
    setPanX(mx - afterX);
    setPanY(my - afterY);
  }, [scale, panX, panY]);

  const resetView = useCallback(() => {
    setScale(0.9);
    setPanX(0);
    setPanY(0);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative border border-gray-700 rounded-md overflow-hidden ${dragRef.current.dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onWheel={handleWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      style={{ touchAction: 'none' }}
    >
      {/* Edge layer */}
      <svg
        width={bounds.width}
        height={bounds.height}
        className="block"
        style={{
          background: "rgba(0,0,0,0.35)",
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: "0 0"
        }}
      >
        <defs>
          <filter id="edge-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {edges.map((e, idx) => (
          <line
            key={idx}
            x1={e.x1}
            y1={e.y1}
            x2={e.x2}
            y2={e.y2}
            stroke={e.color}
            strokeOpacity="0.35"
            strokeWidth="3"
            filter="url(#edge-glow)"
          />
        ))}
      </svg>

      {/* Nodes layer */}
      <div
        className="absolute inset-0"
        style={{
          width: bounds.width,
          height: bounds.height,
          transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
          transformOrigin: "0 0"
        }}
        onMouseMove={(e) => {
          // Clear tooltip if mouse isn't over any skill node
          if (!(e.target.closest && e.target.closest('[data-skill-node="1"]'))) {
            setHoverId(null);
          }
        }}
        onMouseLeave={() => setHoverId(null)}
      >
        {visible.map((node) => {
          const pos = toPx(node.position || { x: 0, y: 0 });
          const lvl = getLevel(metaProgress, node.id);
          const colors = tagColors(primaryTag(node));
          const check = canBuy(node, metaProgress, ctx);
          const nextCost = lvl >= node.maxLevel ? 0 : getNodeCost(node, metaProgress, ctx);
          const affordable = check.ok && nextCost <= totalLightSparks;

          const isMaxed = lvl >= node.maxLevel;
          const purchased = lvl > 0;
          const locked = !check.ok;

          let stateClasses = "";
          if (purchased) {
            stateClasses = "ring-2 brightness-110";
          } else if (locked) {
            stateClasses = "opacity-40 grayscale cursor-not-allowed";
          } else if (affordable) {
            stateClasses = "ring-2 hover:ring-4 hover:scale-105 transition-transform";
          } else {
            stateClasses = "opacity-60 grayscale cursor-not-allowed";
          }

          return (
            <div
              key={node.id}
              className="absolute"
              data-skill-node="1"
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
              onMouseEnter={() => setHoverId(node.id)}
              onMouseLeave={() => setHoverId((id) => (id === node.id ? null : id))}
            >
              {/* Hex tile (clipped) */}
              <div
                className={[
                  "flex items-center justify-center select-none",
                  colors.bg,
                  stateClasses,
                  "border",
                  affordable && !isMaxed ? "border-cyan-300 ring-2 ring-cyan-300/60" : (colors.border || "border-cyan-400"),
                  purchased ? "shadow-[0_0_12px_rgba(0,255,255,0.35)]" : "",
                ].join(" ")}
                style={{
                  width: HEX_V,
                  height: HEX_W,
                  clipPath: 'polygon(50% 0%, 93.3% 25%, 93.3% 75%, 50% 100%, 6.7% 75%, 6.7% 25%)'
                }}
                onClick={() => {
                  if (affordable && !isMaxed) onBuyMetaNode(node.id);
                }}
                title=""
              >
                <span className={`text-2xl ${colors.icon}`}>{node.icon || "🔸"}</span>
              </div>

              {/* Level badge (outside clip) */}
              <div className="absolute -bottom-2 right-1 bg-black/80 text-yellow-300 text-[11px] px-1 rounded border border-gray-700 pointer-events-none">
                {lvl}/{node.maxLevel}
              </div>

              {/* Tooltip (outside clip) */}
              {hoverId === node.id && (
                <div className="absolute">
                  <NodeTooltip
                    node={node}
                    level={lvl}
                    maxLevel={node.maxLevel}
                    nextCost={nextCost}
                    check={check}
                    affordable={affordable}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div className="absolute top-2 right-2 flex gap-2 pointer-events-auto">
        <button onClick={() => zoomBy(0.9)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-sm">-</button>
        <button onClick={() => zoomBy(1.1)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-sm">+</button>
        <button onClick={resetView} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded text-sm">Reset</button>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-2 left-2 bg-black/70 border border-gray-700 rounded p-2 text-xs text-cyan-200 pointer-events-none">
        <div className="font-semibold text-cyan-300 mb-1">Statistik</div>
        <div>Gekaufte Knoten: {visible.filter(n => getLevel(metaProgress, n.id) > 0).length}/{visible.length}</div>
        <div>Kaufbar: {visible.filter(n => {
          const lvl = getLevel(metaProgress, n.id);
          const cost = lvl >= n.maxLevel ? Infinity : getNodeCost(n, metaProgress, ctx);
          const check = canBuy(n, metaProgress, ctx);
          return check.ok && cost <= totalLightSparks;
        }).length}</div>
        <div>Sparks ausgegeben: {metaStats?.totalSparksSpent || 0}</div>
        <div>Max. Welle: {(() => {
          try { return parseInt(localStorage.getItem('highestWaveReached') || '0'); } catch { return 0; }
        })()}</div>
      </div>
    </div>
  );
};

export default SkillTreeGraph;
