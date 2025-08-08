# Skill-Tree Planung (Meta + Run)

Ziele
- Viele bedeutsame, spürbare Upgrades mit Synergien und klaren Build-Identitäten.
- Zwei Ebenen:
  1) Permanenter Meta-Skill-Tree (zwischen Runs)
  2) Run-Skill-Tree (innerhalb eines Runs, Shop zwischen Wellen)
- Gestaffelte Enthüllung: Knoten erscheinen erst, wenn Freischaltbedingungen erfüllt sind (Vorstufen, Wellenfortschritt, insgesamt ausgegebene Funken, Achievements, etc.).
- Modular, datengetrieben, erweiterbar: Neue Knoten sollen ohne Code-Anpassung im Kernsystem per Daten ergänzt werden können.

Technische Architektur
- Datengetrieben:
  - `skillTree/metaTree.js` und `skillTree/runTree.js`: Node-Listen als reine Daten.
  - `skillTree/engine.js`: Evaluierung (Kosten, Unlock, Reveal, Exklusivität), Selektor für sichtbare/erwerbbare Knoten.
  - `skillTree/cost.js` & `skillTree/unlock.js`: Hilfsfunktionen.
  - `skillTree/types.js`: JSDoc-Typen für Intellisense/Erweiterbarkeit.
- State/Persistenz:
  - Meta-Progress (gekaufte Knoten/Levels) + Meta-Statistiken (z. B. totalSpent, Achievements) in `localStorage`.
  - Bestehender `totalLightSparks`-State bleibt Quelle für verfügbares „Guthaben“.
- UI:
  - `components/game/SkillTreePanel.jsx`: Grid-basierte Sicht auf den Meta-Tree (Fog-of-War light: nur sichtbare Nachbarn).
  - `components/game/SkillTreeNodeCard.jsx`: Karte pro Knoten (Name, Desc, Kosten, Level, Tags, gesperrt/entsperrt).
  - Integration in `PermanentUpgradesScreen`: Alter Bereich bleibt (bestehende vier Upgrades), darunter neuer Bereich „Skill-Tree (Beta)“.

Datenmodell (beide Trees)
```ts
type Cost =
  | { type: "static"; base: number }
  | { type: "exp"; base: number; factor: number }      // exponentiell (z. B. 1.35^level)
  | { type: "waveScaled"; base: number; factor: number } // run-basiert mit Wellen-Skalierung

type Unlock = {
  minWave?: number;                // (Run)
  totalSparksSpent?: number;       // (Meta kumulativ)
  achievements?: string[];         // Platzhalter fürs spätere System
  purchasedAnyOf?: string[];       // Nachbarn/Verzweigungen
  purchasedAllOf?: string[];
  metaLevelMin?: number;           // mind. Level eines anderen Meta-Knotens
}

type Reveal = {
  neighborOf?: string[];           // Fog-of-War: nur in Nähe sichtbarer Knoten
  hiddenUntilUnlock?: boolean;     // Verstecken bis Unlock erfüllt
}

type Node = {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;                // 1 für Keystones
  cost: Cost;
  tags: string[];                  // ["offense","defense","mobility","economy","utility","keystone"]
  prereqs?: string[];              // Muss zuvor erfüllt/gekauft sein
  unlock?: Unlock;
  reveal?: Reveal;
  exclusiveWith?: string[];        // Exklusivitäten, z. B. Keystones
  icon?: string;                   // UI/Icon-Emoji
}
```

Kosten-/Levelskalierung
- Exponentielle Kosten: `cost(base, factor, level) = floor(base * factor^level)`.
- Wellen-skalierte Run-Kosten: `floor((base + wave * base*0.25) * factor^(level))`.
- Stacks/Level-Cap per Node; Keystones meist Level 1.

Freischalt-/Enthüllungslogik
- Unlock:
  - `prereqs`: harte Abhängigkeiten.
  - `unlock`: weiche Gates (Min-Welle, totalSpent, Achievements, „purchasedAny/All“).
- Reveal (Fog-of-War light):
  - Knoten werden sichtbar, wenn mindestens ein Nachbar gekauft/aufgedeckt ist (oder Startknoten).
  - Optional `hiddenUntilUnlock` verhindert frühe Sichtbarkeit.
- Exklusivität:
  - Kauf eines Keystones sperrt alle exklusiven Gegenspieler.
  - Engine verhindert Kauf/Anzeigen, wenn Konflikt besteht.

Dateistruktur (neu)
```
skillTree/
  types.js
  cost.js
  unlock.js
  engine.js
  metaTree.js
  runTree.js
components/game/
  SkillTreePanel.jsx
  SkillTreeNodeCard.jsx
docs/
  skill-tree-plan.md
```

Integration mit vorhandenem Code
- Run-Tree:
  - Phase 1: Bestehendes `upgradeSystem.js` weiterverwenden (Kompatibilität).
  - Phase 2: `upgradeSystem.js` internt auf `skillTree/runTree.js` + `engine` umrüsten; anfänglich nur bestehende Typen (`parry_size`, `parry_duration`, etc.) als Nodes modellieren, später erweitern um neue.
- Meta-Tree:
  - `PermanentUpgradesScreen`: erhält neuen Panel-Abschnitt mit Node-Grid.
  - `App.jsx`: ergänzt State für `metaProgress` und `metaStats` (z. B. `totalSpent`), Handler `buyMetaNode(nodeId)`:
    - Prüft Kosten/Unlock via Engine,
    - zieht `totalLightSparks` ab,
    - erhöht Level in `metaProgress`,
    - erhöht `metaStats.totalSpent`,
    - persistiert beides.

Schnittstellen-Entwürfe
```ts
// engine.js
function getVisibleNodes(allNodes: Node[], ctx): Node[]
function canBuy(node: Node, progress, ctx): { ok: boolean; reason?: string }
function getNodeCost(node: Node, progress, ctx): number
function purchase(nodeId: string, progress): progress  // erhöht Level, prüft Cap extern

// unlock.js
function isUnlocked(node: Node, progress, ctx): boolean
function isRevealed(node: Node, progress, ctx): boolean

// cost.js
function computeCost(node: Node, level: number, ctx): number
```

Kontext (ctx)
```ts
type MetaCtx = {
  totalLightSparks: number;    // aktuelles Guthaben
  totalSparksSpent: number;    // kumulativ ausgegeben (Meta)
  achievements: string[];      // später
}

type RunCtx = {
  wave: number;
  metaProgress: Record<string, number>; // Einfluss Meta auf Run-Pool
}
```

Startumfang Nodes (Meta) – erste Iteration (ausbaufähig)
- Startknoten (immer sichtbar):
  - core_armor „Chitinpanzer“ (defense, L5, exp 100/1.35)
  - core_damage „Photonenfokus“ (offense, L10, exp 120/1.28)
  - utility_magnet „Magnetismus“ (utility, L10, exp 80/1.28)
- Verzweigungen:
  - core_hp „Robustkörper“ (defense, L10) → unlockt regen „Biolum-Regeneration“ (L5)
  - rof „Schnellfeuer“ (offense, L10) → doppelschuss „Doppelschuss“ (L5) → multischuss „Multischuss“ (L3)
  - crit_chance „Facettenlinse“ (offense, L10) → crit_dmg „Glühende Stachel“ (L5)
- Keystones (exklusiv):
  - keystone_tank „Panzerkäfer“ (+DR, -Damage/-Speed)
  - keystone_glass „Glasflügel“ (+Damage, -HP)
- Ökonomie:
  - econ_collector „Sammlerinstinkt“ (economy, L10)
  - econ_vendor „Händlerbindung“ (economy, L3)
  - econ_reroll „Reroll-Fundus“ (economy, L3)
- Gating-Beispiele:
  - Einige T2-Knoten benötigen `totalSparksSpent ≥ 1000`.
  - Keystones benötigen bestimmte Vorpfade (z. B. Multischuss L3 + Crit L3).

Startumfang Nodes (Run) – Phase 1 (Kompatibilität)
- Modelliert bestehende Run-Upgrades als Nodes:
  - parry_size, parry_duration, double_sparks, health_regen, parry_cooldown, spark_magnet, extra_health
- Gating:
  - minWave-basierte Sichtbarkeit für ausgewählte (z. B. extra_health ab Welle 2).
- Phase 2 (Erweiterung): Neue Run-Kategorien (Waffenspezialisierung, AOE, Drohnen, Ultis, Risiko/Belohnung).

UI-Konzept SkillTreePanel
- Grid mit Karten:
  - Titel, Icon, Kurzbeschreibung
  - Tags (Chips)
  - Levelanzeige (aktuell / max)
  - Kostenanzeige für nächste Stufe
  - Button „Kaufen“ (disabled + Tooltip mit Grund)
  - Gesperrt: „?“-Karte mit vagen Hinweisen (wenn `hiddenUntilUnlock`), oder ausgegraut mit Hinweis „Voraussetzung fehlt“
- Filter (später): Tags filtern (Offense/Defense/Utility/Economy/Keystone)

Persistenz
- `localStorage`:
  - `metaProgress` (Map nodeId → level)
  - `metaStats`:
    - `totalSparksSpent`: Zahl
    - `achievements`: string[]

Migrations/Kompatibilität
- Bestehende permanente Upgrades bleiben zunächst unverändert.
- SkillTreePanel lebt ergänzend im gleichen Screen, so dass wir inkrementell migrieren können.
- Später: Ablösung der alten 4 Upgrades durch äquivalente Meta-Nodes (oder 1:1 Mapping).

Implementierungsplan (Iterativ)
1) Daten/Engine
   - [ ] `skillTree/types.js`, `cost.js`, `unlock.js`, `engine.js` (Minimalfunktionen)
   - [ ] `skillTree/metaTree.js` mit Startumfang (ca. 12–16 Nodes, inkl. Keystones)
   - [ ] `skillTree/runTree.js` mit bestehenden Run-Upgrades
2) UI/State
   - [ ] `components/game/SkillTreeNodeCard.jsx`, `SkillTreePanel.jsx`
   - [ ] `App.jsx`: `metaProgress`, `metaStats`, Handler `buyMetaNode`
   - [ ] `PermanentUpgradesScreen.jsx`: Panel einhängen (props: totalLightSparks, metaProgress, metaStats, onBuyMetaNode)
3) Run-Integration (optional in Phase 1)
   - [ ] `upgradeSystem.js` weiterhin kompatibel
   - [ ] (Phase 2) Intern auf Engine/Rundaten umstellen
4) Feinheiten
   - [ ] Tooltips, Lock-Gründe
   - [ ] Reveal-Logik (Nachbarn sichtbar)
   - [ ] Exklusivitäts-UI (Schloss/Icon, Tooltip)
   - [ ] Performance/Resizing

Beispiel-Knoten (Meta, kompakt)
```js
// core_armor
{
  id: "core_armor",
  name: "Chitinpanzer",
  desc: "+5% Schadensreduktion pro Stufe.",
  maxLevel: 5,
  cost: { type: "exp", base: 100, factor: 1.35 },
  tags: ["defense"],
  icon: "🛡️"
}

// keystone_glass (exklusiv zu keystone_tank)
{
  id: "keystone_glass",
  name: "Glasflügel",
  desc: "+40% Schaden, -25% HP.",
  maxLevel: 1,
  cost: { type: "exp", base: 1200, factor: 1.6 },
  tags: ["offense","keystone"],
  prereqs: ["proj_multishot"],
  unlock: { totalSparksSpent: 1500 },
  exclusiveWith: ["keystone_tank"],
  icon: "🦋"
}
```

Beispiel-Knoten (Run, kompatibel)
```js
{
  id: "parry_size",
  name: "Größerer Lichtschild",
  desc: "+5% Parry-Schildgröße",
  maxLevel: 8,
  cost: { type: "waveScaled", base: 80, factor: 1.15 },
  tags: ["run","defense"],
  unlock: { minWave: 1 },
  icon: "🛡️"
}
```

Abhängigkeiten/Wartbarkeit
- Striktes Trennen zwischen Daten (Nodes) und Logik (Engine).
- Keine Business-Logik in UI-Komponenten.
- Einfache Erweiterbarkeit: Neue Nodes = nur in Daten hinzufügen.
- Kleine, fokussierte Dateien/Komponenten, um Lesbarkeit hoch zu halten.

Nächste Schritte (Umsetzung)
- Schritt 1 (dieser Commit): Planung in docs/skill-tree-plan.md (diese Datei)
- Schritt 2: Implementiere `skillTree/*`-Module (Engine + Daten).
- Schritt 3: Ergänze UI-Komponenten und integriere in `PermanentUpgradesScreen`.
- Schritt 4: Persistenz in `App.jsx` und Kauf-Flow.
- Schritt 5: Optionale Run-Umstellung in `upgradeSystem.js` (Phase 2), plus Reveal-Gating beim Run-Pool.
