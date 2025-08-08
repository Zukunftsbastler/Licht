/**
 * Kostenberechnung für Skill-Tree-Knoten
 * - exp: exponentielle Skalierung pro bereits gekauftem Level
 * - static: fixer Basispreis
 * - waveScaled: Basispreis skaliert mit Welle (für Run-Tree)
 */

/**
 * @param {import("./types.js").Node} node
 * @param {number} currentLevel - aktuelles Level des Knotens (0-basiert)
 * @param {{ wave?: number }} [ctx]
 */
export function computeCost(node, currentLevel, ctx) {
  const c = node.cost;
  const firstBase = typeof c.firstLevelBase === "number" ? c.firstLevelBase : undefined;

  switch (c.type) {
    case "exp": {
      const base = currentLevel === 0 && firstBase != null ? firstBase : c.base;
      const amount = base * Math.pow(c.factor, currentLevel);
      return Math.max(1, Math.floor(amount));
    }
    case "static": {
      const base = currentLevel === 0 && firstBase != null ? firstBase : c.base;
      return Math.max(1, Math.floor(base));
    }
    case "waveScaled": {
      const wave = ctx?.wave ?? 0;
      const base = currentLevel === 0 && firstBase != null ? firstBase : c.base;
      const baseWithWave = base + Math.floor(wave * base * 0.25);
      const amount = baseWithWave * Math.pow(c.factor, currentLevel);
      return Math.max(1, Math.floor(amount));
    }
    default:
      return 0;
  }
}
