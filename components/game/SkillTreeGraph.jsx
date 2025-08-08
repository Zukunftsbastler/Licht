import React, { useMemo, useState, useCallback } from "react";
import { metaNodes } from "@/skillTree/metaTree.js";
import {
  getVisibleNodes,
  getNodeCost,
  canBuy,
  getLevel,
  indexById,
} from "@/skillTree/engine.js";

const UNIT = 140; // px per grid unit
const MARGIN = 100; // outer margin

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
  let minX = 0,
    maxX = 0,
    minY = 0,
    maxY = 0;
  nodes.forEach((n) => {
    const p = n.position || { x: 0, y: 0 };
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });
  const width = (maxX - minX + 1) * UNIT + MARGIN * 2;
  const height = (maxY - minY + 1) * UNIT + MARGIN * 2;
  const offsetX = MARGIN + -minX * UNIT;
  const offsetY = MARGIN + -minY * UNIT;
  return { width, height, offsetX, offsetY, minX, maxX, minY, maxY };
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
    (p) => ({
      x: bounds.offsetX + p.x * UNIT,
      y: bounds.offsetY + p.y * UNIT,
    }),
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

  return (
    <div className="relative border border-gray-700 rounded-md overflow-hidden">
      {/* Edge layer */}
      <svg
        width={bounds.width}
        height={bounds.height}
        className="block"
        style={{ background: "rgba(0,0,0,0.35)" }}
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
        style={{ width: bounds.width, height: bounds.height }}
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
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className={[
                  "relative w-16 h-16 rounded-full",
                  "flex items-center justify-center select-none",
                  colors.bg,
                  colors.border,
                  colors.ring,
                  stateClasses,
                  "border",
                  purchased ? "shadow-[0_0_12px_rgba(0,255,255,0.35)]" : "",
                ].join(" ")}
                onMouseEnter={() => setHoverId(node.id)}
                onMouseLeave={() => setHoverId((id) => (id === node.id ? null : id))}
                onClick={() => {
                  if (affordable && !isMaxed) onBuyMetaNode(node.id);
                }}
                title="" // suppress default tooltip; we use custom
              >
                <span className={`text-2xl ${colors.icon}`}>{node.icon || "🔸"}</span>
                {/* Level badge */}
                <div className="absolute -bottom-2 right-1 bg-black/80 text-yellow-300 text-[10px] px-1 rounded border border-gray-700">
                  {lvl}/{node.maxLevel}
                </div>

                {/* Tooltip with details (shown on hover) */}
                {hoverId === node.id && (
                  <NodeTooltip
                    node={node}
                    level={lvl}
                    maxLevel={node.maxLevel}
                    nextCost={nextCost}
                    check={check}
                    affordable={affordable}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SkillTreeGraph;
