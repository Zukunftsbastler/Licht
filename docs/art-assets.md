# Sprite- und Umwelt-Asset-Plan (Licht‑Käfer)

Ziel: Ersetzen der abstrakten Kreise durch 32×32‑Pixel‑Sprites mit klarer Vorderseite und 4 Animationsphasen (Bewegungsillusion), plus generative, thematisch passende Wald‑Umgebungselemente mit Interaktionen. Projektile bleiben geometrisch/Partikel.

---

## 1) Akteure – vollständige Sprite‑Liste (32×32, 4 Frames)

Hinweis: Akteure richten ihre Vorderseite dynamisch in Bewegungsrichtung aus (Rotation um den Mittelpunkt). Die „Front“ wird visuell durch Augen/Antennen/Leuchte deutlich gemacht. Animationsrate skaliert mit Geschwindigkeit.

- Spieler
  - ID/Datei: `player.png`
  - Rolle: Licht‑Käfer (Protagonist)
  - Silhouette/Front: abgesetzter Kopf mit Leuchtaugen + Antennen, kleiner leuchtender Hinterleib
  - Animation: 4‑Frame „Flügelschlag/Schritt“ (z. B. leichte Segment‑/Flügelbewegung)

- Gegner (aus `enemySystem.js` / `ENEMY_TEMPLATES` – `body.type` → Dateiname)
  1. Irrlicht (BASIC) → `irrlicht.png`
     - Front: helle Kern‑„Flamme“ mit führender Spitze
     - Bewegung: schwebend
     - Animation: Flimmern/Flammenzunge
  2. Raser (FAST) → `raser.png`
     - Front: spitz zulaufend (Kopf), kleine „Speed‑Stripes“
     - Animation: Beinchen/Fühler vibrieren
  3. Pulsar (BURST) → `pulsar.png`
     - Front: pulsierender Kern, Ringwellen
     - Animation: radiales Aufblähen/Schrumpfen
  4. Fächer‑Klaue (SPREAD) → `faecher-klaue.png`
     - Front: Klaue/Greifer zeigt nach vorn
     - Animation: Fächer öffnet/schließt sich leicht
  5. Zickzack (ZIGZAG) → `zickzack.png`
     - Front: pfeilförmiger Kopf
     - Animation: zuckende Kontur/„Blitzkanten“
  6. Streuer (SHOTGUNNER) → `streuer.png`
     - Front: mehräugig, breite „Maulöffnung“
     - Animation: Mund/Carapax pulsiert
  7. Schütze (SNIPER) → `schuetze.png`
     - Front: Ziellinse rote/helle Linse
     - Animation: Linse fokussiert (kleines Zoom‑Puls)
  8. Orbitant (ORBITER) → `orbitant.png`
     - Front: zentraler Kern + 2–3 Satellitenpunkte
     - Animation: Satelliten kreisen in 4 Phasen
  9. Flimmer (TELEPORTER) → `flimmer.png`
     - Front: Versatz‑Geisterbilder, „scanline“-Flimmer
     - Animation: Phase‑Shift (Ghost‑Pixel)
  10. Hetzer (MISSILE_LAUNCHER) → `hetzer.png`
      - Front: harpunenartige Spitze
      - Animation: Rückstoß‑Flosse pulsiert
  11. Rammer (DASHER) → `rammer.png`
      - Front: wuchtige Stirnplatte
      - Animation: Vor‑/Zurück‑Stoßkörper
  12. Wächter (BOSS_WARDEN) → `boss_waechter.png` (größerer Kontrast, klare Front)
      - Front: Schild/Helm‑Front, zentrierte „Visier“-Augen
      - Animation: Atem/Impuls in 4 Stufen
  13. Fadenmeister (BOSS_WEAVER) → `boss_fadenmeister.png`
      - Front: Spinn-/Web‑Kopf mit Okkularen
      - Animation: Webfäden pulsieren in 4 Phasen

Nicht als eigene Sprites: Projektile (geometrisch/Partikel), Sparks (Partikel), Partikel‑Effekte.

---

## 2) Sprite‑Spezifikation & Pipeline

- Format:
  - Einzel‑Sprite‑Sheets pro Akteur
  - Maße: 32×32 px je Frame
  - Frames: 4 nebeneinander (Breite gesamt 128×32 pro Akteur)
  - Reihenfolge: F0, F1, F2, F3 (links → rechts)
  - Transparenter Hintergrund (RGBA)
- Animation:
  - Frame‑Index = floor(animTime * fps) % 4
  - Standard‑fps: 6–10; skaliert mit effektiver Bewegungsgeschwindigkeit
  - Richtung: Render‑Rotation um Sprite‑Mitte (keine Varianten pro Richtung nötig)
- Vorderseite:
  - Immer klar markiert: Augen/Antennen/Spitze, hellere Pixel vorne
  - Beim Drehen bleibt „Front“ sichtbar, Hinterteil/Schwanz dunkler
- Dateinamen/Namenskonventionen:
  - `public/sprites/actors/player.png`
  - `public/sprites/actors/irrlicht.png`
  - `public/sprites/actors/raser.png`
  - `public/sprites/actors/pulsar.png`
  - `public/sprites/actors/faecher-klaue.png`
  - `public/sprites/actors/zickzack.png`
  - `public/sprites/actors/streuer.png`
  - `public/sprites/actors/schuetze.png`
  - `public/sprites/actors/orbitant.png`
  - `public/sprites/actors/flimmer.png`
  - `public/sprites/actors/hetzer.png`
  - `public/sprites/actors/rammer.png`
  - `public/sprites/actors/boss_waechter.png`
  - `public/sprites/actors/boss_fadenmeister.png`
- Integration:
  - Sprite‑Loader: erstellt Image‑Objekte; Fallback auf prozedurale Pixel‑Generierung (Offscreen‑Canvas), falls Datei fehlt.
  - Render: ersetzt Kreis‑Draw durch `drawSprite(entity, angle, frame)`, rotiert um Mittelpunkt, skaliert optional auf `body.radius*2` wenn gewünscht.
  - State:
    - `enemy.dirAngle`: Bewegungswinkel (im Update berechnet)
    - `enemy.animTime`: akkumulierte Zeit für Animation
    - `player.dirAngle`: Richtung aus Delta(Mouse) pro Frame
    - Keine Änderung der Spiel‑Logik notwendig.

---

## 3) Generativer Pixel‑Wald – interaktive Umgebungselemente

Ziel: Dichte, stimmige, prozedural erzeugte Szene. Elemente werden aus Kacheln/„Stamps“ generiert (8×8/16×16), zu Clustern zusammengesetzt. Elemente können ästhetisch, nützlich, schädlich oder narrativ sein.

- Bäume
  - Eiche/Fichte/Birke (3–4 Varianten, mit Jahresring‑Stümpfen)
  - Funktion: Ästhetik; optionale schwache Parallaxe
  - Varianten: „Harzbaum“ (klebriger Boden‑Patch: verlangsamt leicht) [Schädlich/Gameplay]
  - „Flüsterbaum“: seltenes Ambient‑Sound/Tooltip [Narrativ]
- Sträucher/Hecken
  - Funktion: kleine Sichteinschränkung/leichtes Verlangsamen am Rand [Schädlich/Gameplay]
  - Verbergen gelegentlich Sparks [Nützlich]
- Grasbüschel/Blätterteppich
  - Funktion: rein ästhetisch; Windwellen [Ästhetisch]
- Pilze
  - Leuchtpilz: temporärer Licht‑Radius‑Buff / +1 Heilung einmalig [Nützlich]
  - Sporenpilz: Sporen‑Wolke (kurzer Slow/Dot) [Schädlich]
  - Sprungpilz: kleiner Stoß/Dash in Blickrichtung [Nützlich/Gameplay]
- Spinnennetze (Weben)
  - Funktion: verlangsamt Akteure deutlich [Schädlich], thematisch zum „Fadenmeister“
- Steine/Felsen/Kieselpfade
  - Funktion: ästhetisch; große Felsen können Projektile leicht ablenken [Gameplay/Ästhetik]
- Baumstümpfe/umgestürzte Stämme
  - Funktion: Deckung für Strahlen/Schüsse (reduzierte Trefferchance) [Gameplay]
- Dornenranken
  - Funktion: Kontakt‑Schaden (gering) [Schädlich]
- Pfützen/Tümpel
  - Funktion: verlangsamen moderate Zeit [Schädlich]; Spiegelglanz‑Pixel [Ästhetik]
- Leuchtblumen
  - Funktion: temporär Pickup‑Radius erhöhen (Spark‑Magnet) [Nützlich]
- Nebelschwaden
  - Funktion: leichte Unschärfe in Zone [Narrativ/Ästhetik]
- Lichtaltäre (selten)
  - Funktion: Wellen‑Event: kleiner Heileffekt oder Mini‑Upgrade‑Wahl [Nützlich/Narrativ]
- Glühwürmchen‑Schwärme
  - Funktion: ambientes Partikel; selten +1 Spark beim Einsammeln [Leicht nützlich/Ästhetik]
- Windfahnen/Laubwirbel
  - Funktion: minimaler Drift auf leichte Projektile [Gameplay/Ästhetik]

Generationsprinzip:
- Seed‑basiert pro Run („Wald‑Seed“) für Reproduzierbarkeit
- Zonen: dichter Wald am Rand, Lichtungen in der Mitte
- Kollision: zunächst rein visuell (kein harter Collider), Effekte über Zonen‑Trigger

---

## 4) Technische Integration (Code‑Änderungen, minimalinvasiv)

- Rendering (Canvas)
  - Erweitern: `App.jsx` Render: 
    - Ersetze Gegner/Spieler‑Kreise durch `drawSprite`
    - Berechne `angle`:
      - Spieler: aus `lastPos -> currentPos`
      - Gegner: im `updateEnemy` beim Bewegen setzen (`enemy.dirAngle = atan2(vy, vx)`)
  - Animationszeit:
    - `enemy.animTime += deltaTime`
    - `player.animTime += deltaTime`
- Sprite‑Runtime
  - Neues Modul: `sprites/spriteRenderer.js`
    - `loadActorSprites(map)`: lädt PNGs, erstellt Fallback‑Frames
    - `getFrame(actorId, animTime, speed)`: liefert Frame‑Index 0..3
    - `drawSprite(ctx, image, x, y, angle, frame)`
  - Fallback‑Generator (Optional/Dev):
    - Offscreen‑Canvas mit Pixelmustern je Akteur (Farben/Front‑Augen)
- Hintergrund‑Generator
  - Neues Modul: `background/generator.js`
    - Einmalig Offscreen‑Canvas bauen (800×600), Tiles verteilen (Bäume/Sträucher/Gras/Pilze/Steine)
    - Im Render per `ctx.drawImage(background, 0, 0)`
    - Interaktionszonen separat (Array von Trigger‑Rects mit Typ)
- Sicherungen
  - Wenn Sprite fehlt/laden fehlschlägt → alter Kreis‑Draw als Fallback
  - Kein Eingriff in Physik/Logik; nur Render/State‑Erweiterung

---

## 5) Benennung & Zuordnung (Mapping ‑ Typ → Datei)

- Spieler → `player.png`
- BASIC / Irrlicht → `irrlicht.png`
- FAST / Raser → `raser.png`
- BURST / Pulsar → `pulsar.png`
- SPREAD / Fächer‑Klaue → `faecher-klaue.png`
- ZIGZAG / Zickzack → `zickzack.png`
- SHOTGUNNER / Streuer → `streuer.png`
- SNIPER / Schütze → `schuetze.png`
- ORBITER / Orbitant → `orbitant.png`
- TELEPORTER / Flimmer → `flimmer.png`
- MISSILE_LAUNCHER / Hetzer → `hetzer.png`
- DASHER / Rammer → `rammer.png`
- BOSS_WARDEN / Wächter → `boss_waechter.png`
- BOSS_WEAVER / Fadenmeister → `boss_fadenmeister.png`

---

## 6) Nächste Implementationsschritte

1) Sprite‑Runtime + Fallback‑Generator bauen (`sprites/spriteRenderer.js`)  
2) `enemySystem.updateEnemy` um `dirAngle` und `animTime` erweitern  
3) `App.jsx` Render: Kreise → `drawSprite` (mit Fallback)  
4) Hintergrund‑Generator (`background/generator.js`) + einmaliges Zeichnen  
5) Schrittweise echte PNG‑Sprite‑Sheets unter `public/sprites/actors/…` ersetzen

Dieses Dokument deckt die vollständige Liste der benötigten Figuren, die Animations‑/Richtungsanforderungen und die interaktiven, generativ erzeugten Umgebungselemente ab und passt zur bestehenden Architektur (Canvas‑Render, unveränderte Kernlogik, optionale Fallbacks).
