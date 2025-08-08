/**
 * Run-Skill-Tree (Kompatibilität mit aktuellem upgradeSystem.js)
 * Diese Nodes spiegeln die bestehenden temporären Upgrades wider
 * und ermöglichen späteres Gating über minWave o. Ä.
 */

/** @type {import("./types.js").Node[]} */
export const runNodes = [
  {
    id: "parry_size",
    name: "Größerer Lichtschild",
    desc: "+5% Parry-Schildgröße",
    maxLevel: 8,
    cost: { type: "waveScaled", base: 80, factor: 1.15 },
    tags: ["run", "defense"],
    unlock: { minWave: 1 },
    icon: "🛡️",
  },
  {
    id: "parry_duration",
    name: "Längerer Lichtimpuls",
    desc: "+10% Parry-Schilddauer",
    maxLevel: 6,
    cost: { type: "waveScaled", base: 85, factor: 1.15 },
    tags: ["run", "defense"],
    unlock: { minWave: 1 },
    icon: "⏱️",
  },
  {
    id: "double_sparks",
    name: "Funkenverdoppler",
    desc: "+10% Chance auf doppelte Licht-Funken",
    maxLevel: 10,
    cost: { type: "waveScaled", base: 90, factor: 1.15 },
    tags: ["run", "economy"],
    unlock: { minWave: 1 },
    icon: "✨",
  },
  {
    id: "health_regen",
    name: "Heilendes Licht",
    desc: "Regeneriert 1 Leben alle 10 Sekunden",
    maxLevel: 3,
    cost: { type: "waveScaled", base: 110, factor: 1.18 },
    tags: ["run", "defense", "utility"],
    unlock: { minWave: 2 },
    icon: "❤️",
  },
  {
    id: "parry_cooldown",
    name: "Schnellere Reflexe",
    desc: "-15% Parry-Cooldown",
    maxLevel: 4,
    cost: { type: "waveScaled", base: 95, factor: 1.15 },
    tags: ["run", "utility", "defense"],
    unlock: { minWave: 1 },
    icon: "⚡",
  },
  {
    id: "spark_magnet",
    name: "Licht-Magnet",
    desc: "Sammelt Licht-Funken aus größerer Entfernung",
    maxLevel: 3,
    cost: { type: "waveScaled", base: 80, factor: 1.15 },
    tags: ["run", "utility", "economy"],
    unlock: { minWave: 1 },
    icon: "🧲",
  },
  {
    id: "extra_health",
    name: "Verstärkter Panzer",
    desc: "+1 zusätzliches Leben",
    maxLevel: 2,
    cost: { type: "waveScaled", base: 140, factor: 1.22 },
    tags: ["run", "defense"],
    unlock: { minWave: 2 },
    icon: "💚",
  },
];

export default runNodes;
