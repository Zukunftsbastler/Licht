/**
 * Unlock- und Reveal-Logik für Skill-Tree-Knoten
 */

/**
 * @param {import("./types.js").Node} node
 * @param {Record<string, number>} progress   // nodeId -> level
 * @param {{ achievements?: string[] }} [ctx]
 */
export function hasPrereqs(node, progress, ctx) {
  if (!node.prereqs || node.prereqs.length === 0) return true;
  return node.prereqs.every((id) => (progress[id] || 0) > 0);
}

/**
 * @param {import("./types.js").Node} node
 * @param {Record<string, number>} progress
 * @param {import("./types.js").MetaCtx | import("./types.js").RunCtx} [ctx]
 */
export function isUnlocked(node, progress, ctx) {
  if (!hasPrereqs(node, progress, ctx)) return false;

  const u = node.unlock;
  if (!u) return true;

  if (typeof u.minWave === "number") {
    const wave = /** @type {import("./types.js").RunCtx} */ (ctx)?.wave ?? 0;
    if (wave < u.minWave) return false;
  }

  if (typeof u.totalSparksSpent === "number") {
    const spent = /** @type {import("./types.js").MetaCtx} */ (ctx)?.totalSparksSpent ?? 0;
    if (spent < u.totalSparksSpent) return false;
  }

  if (u.achievements && u.achievements.length > 0) {
    const got = new Set((/** @type {import("./types.js").MetaCtx} */ (ctx))?.achievements || []);
    const ok = u.achievements.every((a) => got.has(a));
    if (!ok) return false;
  }

  if (u.purchasedAllOf && u.purchasedAllOf.length > 0) {
    const ok = u.purchasedAllOf.every((id) => (progress[id] || 0) > 0);
    if (!ok) return false;
  }

  if (u.purchasedAnyOf && u.purchasedAnyOf.length > 0) {
    const ok = u.purchasedAnyOf.some((id) => (progress[id] || 0) > 0);
    if (!ok) return false;
  }

  if (u.metaLevelMinBy) {
    for (const [id, minLv] of Object.entries(u.metaLevelMinBy)) {
      if ((progress[id] || 0) < minLv) return false;
    }
  }

  return true;
}

/**
 * Reveal (Sichtbarkeit ohne Kauf)
 * - Wenn kein reveal definiert, ist der Knoten sichtbar.
 * - neighborOf: Sichtbar sobald mindestens ein Nachbar gekauft ist.
 * - hiddenUntilUnlock: Falls true, bleibt der Knoten verborgen bis isUnlocked true ist.
 * @param {import("./types.js").Node} node
 * @param {Record<string, number>} progress
 * @param {import("./types.js").MetaCtx | import("./types.js").RunCtx} [ctx]
 */
export function isRevealed(node, progress, ctx) {
  const r = node.reveal;
  if (!r) return true;

  if (r.hiddenUntilUnlock && !isUnlocked(node, progress, ctx)) {
    return false;
  }

  if (r.neighborOf && r.neighborOf.length > 0) {
    const visibleByNeighbor = r.neighborOf.some((id) => (progress[id] || 0) > 0);
    if (!visibleByNeighbor) return false;
  }

  return true;
}
