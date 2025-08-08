/**
 * Meta-Skill-Tree: Startumfang an Knoten
 * Leichtgewichtiger erster Satz, erweiterbar per Daten.
 * Tags: "offense","defense","mobility","economy","utility","keystone"
 * Kosten: größtenteils exponentiell
 */

/** @type {import("./types.js").Node[]} */
export const metaNodes = [
  // Startknoten (sichtbar)
  {
    id: "core_armor",
    name: "Chitinpanzer",
    desc: "+5% Schadensreduktion pro Stufe.",
    maxLevel: 5,
    cost: { type: "exp", base: 100, factor: 1.35 },
    tags: ["defense"],
    icon: "🛡️",
  },
  {
    id: "core_damage",
    name: "Photonenfokus",
    desc: "+2 Grundschaden pro Stufe.",
    maxLevel: 10,
    cost: { type: "exp", base: 120, factor: 1.28 },
    tags: ["offense"],
    icon: "🔆",
  },
  {
    id: "utility_magnet",
    name: "Magnetismus",
    desc: "Erhöht Pickup-Radius pro Stufe.",
    maxLevel: 10,
    cost: { type: "exp", base: 80, factor: 1.28 },
    tags: ["utility"],
    icon: "🧲",
  },

  // Verzweigungen von core_armor
  {
    id: "core_hp",
    name: "Robustkörper",
    desc: "+1 Max-Leben pro Stufe.",
    maxLevel: 10,
    cost: { type: "exp", base: 110, factor: 1.3 },
    tags: ["defense"],
    prereqs: ["core_armor"],
    reveal: { neighborOf: ["core_armor"] },
    icon: "💚",
  },
  {
    id: "regen",
    name: "Biolum-Regeneration",
    desc: "Regeneriert periodisch Leben (Meta-Effekt, Run-skalierend).",
    maxLevel: 5,
    cost: { type: "exp", base: 150, factor: 1.35 },
    tags: ["defense", "utility"],
    prereqs: ["core_hp"],
    unlock: { purchasedAllOf: ["core_hp"] },
    reveal: { neighborOf: ["core_hp"] },
    icon: "✨",
  },

  // Verzweigungen Offense
  {
    id: "rof",
    name: "Schnellfeuer",
    desc: "+5% Feuerrate pro Stufe (Run-Multiplikator).",
    maxLevel: 10,
    cost: { type: "exp", base: 120, factor: 1.3 },
    tags: ["offense"],
    prereqs: ["core_damage"],
    reveal: { neighborOf: ["core_damage"] },
    icon: "⚡",
  },
  {
    id: "double_shot",
    name: "Doppelschuss",
    desc: "Chance auf zusätzliches Projektil.",
    maxLevel: 5,
    cost: { type: "exp", base: 180, factor: 1.32 },
    tags: ["offense"],
    prereqs: ["rof"],
    unlock: { purchasedAllOf: ["rof"] },
    reveal: { neighborOf: ["rof"] },
    icon: "🎯",
  },
  {
    id: "multishot",
    name: "Multischuss",
    desc: "+1 Projektil, hohe Kosten.",
    maxLevel: 3,
    cost: { type: "exp", base: 350, factor: 1.45 },
    tags: ["offense"],
    prereqs: ["double_shot"],
    unlock: { purchasedAllOf: ["double_shot"], totalSparksSpent: 1000 },
    reveal: { neighborOf: ["double_shot"], hiddenUntilUnlock: false },
    icon: "🌀",
  },

  // Krit-Zweig
  {
    id: "crit_chance",
    name: "Facettenlinse",
    desc: "+3% Kritchance pro Stufe.",
    maxLevel: 10,
    cost: { type: "exp", base: 130, factor: 1.28 },
    tags: ["offense"],
    prereqs: ["core_damage"],
    reveal: { neighborOf: ["core_damage"] },
    icon: "💎",
  },
  {
    id: "crit_damage",
    name: "Glühende Stachel",
    desc: "+10% Kritschaden pro Stufe.",
    maxLevel: 5,
    cost: { type: "exp", base: 200, factor: 1.35 },
    tags: ["offense"],
    prereqs: ["crit_chance"],
    unlock: { purchasedAllOf: ["crit_chance"] },
    reveal: { neighborOf: ["crit_chance"] },
    icon: "🗡️",
  },

  // Keystones (exklusiv)
  {
    id: "keystone_tank",
    name: "Panzerkäfer",
    desc: "+40% Schadensreduktion, -20% Schaden, -10% Bewegung.",
    maxLevel: 1,
    cost: { type: "exp", base: 1200, factor: 1.6 },
    tags: ["keystone", "defense"],
    prereqs: ["core_armor", "core_hp"],
    unlock: { purchasedAllOf: ["core_armor", "core_hp"], totalSparksSpent: 1000 },
    reveal: { neighborOf: ["core_hp"], hiddenUntilUnlock: true },
    exclusiveWith: ["keystone_glass"],
    icon: "🐞",
  },
  {
    id: "keystone_glass",
    name: "Glasflügel",
    desc: "+40% Schaden, -25% HP.",
    maxLevel: 1,
    cost: { type: "exp", base: 1200, factor: 1.6 },
    tags: ["keystone", "offense"],
    prereqs: ["multishot", "crit_chance"],
    unlock: { purchasedAllOf: ["multishot", "crit_chance"], totalSparksSpent: 1500 },
    reveal: { neighborOf: ["multishot", "crit_chance"], hiddenUntilUnlock: true },
    exclusiveWith: ["keystone_tank"],
    icon: "🦋",
  },

  // Ökonomie
  {
    id: "econ_collector",
    name: "Sammlerinstinkt",
    desc: "+Sparks-Drops Rate im Run.",
    maxLevel: 10,
    cost: { type: "exp", base: 90, factor: 1.28 },
    tags: ["economy"],
    prereqs: ["utility_magnet"],
    reveal: { neighborOf: ["utility_magnet"] },
    icon: "🪙",
  },
  {
    id: "econ_vendor",
    name: "Händlerbindung",
    desc: "-5% Shoppreise pro Stufe (Run), min 3 Stufen.",
    maxLevel: 3,
    cost: { type: "exp", base: 220, factor: 1.4 },
    tags: ["economy", "utility"],
    prereqs: ["econ_collector"],
    unlock: { purchasedAllOf: ["econ_collector"], totalSparksSpent: 800 },
    reveal: { neighborOf: ["econ_collector"], hiddenUntilUnlock: false },
    icon: "🏷️",
  },
  {
    id: "econ_reroll",
    name: "Reroll-Fundus",
    desc: "+1 Reroll pro Stufe zu Run-Start.",
    maxLevel: 3,
    cost: { type: "exp", base: 260, factor: 1.35 },
    tags: ["economy", "utility"],
    prereqs: ["econ_collector"],
    unlock: { purchasedAllOf: ["econ_collector"] },
    reveal: { neighborOf: ["econ_collector"] },
    icon: "🔁",
  },
];

export default metaNodes;
