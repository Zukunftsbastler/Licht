import { computeCost } from "./cost.js";
import { isUnlocked, isRevealed } from "./unlock.js";

/**
 * Hilfsfunktionen für Progress
 * @param {Record<string, number>} progress
 * @param {string} nodeId
 */
export function getLevel(progress, nodeId) {
  return progress[nodeId] || 0;
}

/**
 * Nächste Stufenkosten eines Knotens
 * @param {import("./types.js").Node} node
 * @param {Record<string, number>} progress
 * @param {import("./types.js").MetaCtx | import("./types.js").RunCtx} [ctx]
 */
export function getNodeCost(node, progress, ctx) {
  const lvl = getLevel(progress, node.id);
  return computeCost(node, lvl, ctx);
}

/**
 * Prüft Exklusivität (ob ein gegensätzlicher Keystone bereits gekauft ist)
 * @param {import("./types.js").Node} node
 * @param {Record<string, number>} progress
 */
export function isExclusiveLocked(node, progress) {
  if (!node.exclusiveWith || node.exclusiveWith.length === 0) return false;
  return node.exclusiveWith.some((id) => (progress[id] || 0) > 0);
}

/**
 * Kaufbarkeitsprüfung
 * - unlock/prereqs
 * - exklusive Knoten
 * - Level-Cap
 * (Budgetprüfung separat im UI/Caller)
 * @param {import("./types.js").Node} node
 * @param {Record<string, number>} progress
 * @param {import("./types.js").MetaCtx | import("./types.js").RunCtx} [ctx]
 * @returns {{ ok: boolean; reason?: string }}
 */
export function canBuy(node, progress, ctx) {
  const lvl = getLevel(progress, node.id);
  if (lvl >= node.maxLevel) return { ok: false, reason: "Maximale Stufe erreicht" };
  if (!isUnlocked(node, progress, ctx)) return { ok: false, reason: "Voraussetzungen nicht erfüllt" };
  if (isExclusiveLocked(node, progress)) return { ok: false, reason: "Exklusiver Knoten bereits aktiv" };
  return { ok: true };
}

/**
 * Sichtbare Knoten (Reveal-Logik)
 * @param {import("./types.js").Node[]} allNodes
 * @param {Record<string, number>} progress
 * @param {import("./types.js").MetaCtx | import("./types.js").RunCtx} [ctx]
 */
export function getVisibleNodes(allNodes, progress, ctx) {
  return allNodes.filter((n) => isRevealed(n, progress, ctx));
}

/**
 * Progress-Update: Erhöht Level eines Knotens um 1 (bis maxLevel)
 * @param {Record<string, number>} progress
 * @param {string} nodeId
 */
export function purchase(progress, nodeId, maxLevel = Infinity) {
  const current = progress[nodeId] || 0;
  const next = Math.min(current + 1, maxLevel);
  return { ...progress, [nodeId]: next };
}

/**
 * Hilfsfunktion: Node-Index erstellen (id -> node)
 * @param {import("./types.js").Node[]} nodes
 */
export function indexById(nodes) {
  /** @type {Record<string, import("./types.js").Node>} */
  const map = {};
  for (const n of nodes) map[n.id] = n;
  return map;
}
