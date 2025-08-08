/**
 * JSDoc-Typdefinitionen für den Skill-Tree
 */

/**
 * @typedef {"static"|"exp"|"waveScaled"} CostType
 */

/**
 * Optional: firstLevelBase erlaubt einen stark vergünstigten Kauf der ersten Stufe.
 * Gilt für alle Kostenarten.
 * @typedef {{ type: "static", base: number, firstLevelBase?: number }} StaticCost
 * @typedef {{ type: "exp", base: number, factor: number, firstLevelBase?: number }} ExpCost
 * @typedef {{ type: "waveScaled", base: number, factor: number, firstLevelBase?: number }} WaveScaledCost
 * @typedef {StaticCost | ExpCost | WaveScaledCost} Cost
 */

/**
 * @typedef Unlock
 * @property {number=} minWave              - Mindestwelle (nur Run-Tree)
 * @property {number=} totalSparksSpent     - kumulativ im Meta ausgegebene Funken
 * @property {string[]=} achievements       - Liste benötigter Achievements
 * @property {string[]=} purchasedAnyOf     - Mindestens ein Knoten aus der Liste muss gekauft sein
 * @property {string[]=} purchasedAllOf     - Alle Knoten aus der Liste müssen gekauft sein
 * @property {Record<string, number>=} metaLevelMinBy - Map nodeId -> minLevel (feinere Kontrolle als prereqs)
 */

/**
 * @typedef Reveal
 * @property {string[]=} neighborOf         - Sichtbar, wenn Nachbar gekauft/sichtbar
 * @property {boolean=} hiddenUntilUnlock   - Komplett verborgen bis Unlock erfüllt
 */

/**
 * @typedef Node
 * @property {string} id
 * @property {string} name
 * @property {string} desc
 * @property {number} maxLevel
 * @property {Cost} cost
 * @property {string[]} tags                 // z. B. ["offense","defense","mobility","economy","utility","keystone","run"]
 * @property {string[]=} prereqs             // harte Abhängigkeiten (min Level 1)
 * @property {Unlock=} unlock
 * @property {Reveal=} reveal
 * @property {string[]=} exclusiveWith
 * @property {string=} icon
 * @property {{ x: number, y: number }=} position   // Layout-Koordinaten für Graph-Ansicht
 */

/**
 * @typedef MetaCtx
 * @property {number} totalLightSparks
 * @property {number} totalSparksSpent
 * @property {string[]} achievements
 */

/**
 * @typedef RunCtx
 * @property {number} wave
 * @property {Record<string, number>} metaProgress
 */

export const COST_TYPES = {
  STATIC: "static",
  EXP: "exp",
  WAVE_SCALED: "waveScaled",
}
