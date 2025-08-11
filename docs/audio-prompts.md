# Audio-Prompts und SFX-Plan (Licht‑Käfer)

Ziel: Zwei kontrastierende Musikstimmungen (Menü entspannt vs. Run treibend) und thematisch passende Geräusche. Die Prompts sind direkt für Suno.ai (Musik) und ElevenLabs Sound Effects (SFX) formuliert. Zusätzlich: Dateibenennung und Produktionshinweise.

---

## 1) Musik – Menü (entspannt, „Wald‑Fahrstuhlmusik“)

Charakter: sanft, freundlich, leicht verspielt, klare Wald‑Anklänge (Holz‑Percussion, Glockenspiel/Vibraphon), wenig Dynamik, instrumental, loopfähig, kein Gesang.

Empfohlene Suno‑Parameter:
- Duration: 60–120s
- Style: instrumental, calm, ambient, lofi, acoustic
- BPM: 70–90
- Key: D‑Dur oder G‑Dur
- Ending: loopable, kein harter Ausklang

Prompt Variante A:
- Text: Calm instrumental “forest elevator music” for a menu screen. Soft vibraphone and gentle woodwinds, light brush drums, subtle woodblock and chime textures, warm analog pad underlay. Bright, peaceful, playful. No vocals. Low dynamics, cozy and friendly. Inspired by a glowing firefly in a mossy grove at night. Clear loopable structure, no abrupt stops. Key D major, ~78 BPM.
- Negative: no vocals, no distortion, no heavy kick, no risers or dramatic transitions.

Prompt Variante B:
- Text: Relaxed lofi‑ambient bossa vibe for a forest menu. Nylon guitar + vibraphone lead, airy flute phrases, soft upright bass, shaker/brush kit, delicate wind chimes. Warm and welcoming, twinkling lights through trees. Instrumental only, loopable, gentle swing. G major, 82 BPM.
- Negative: no vocals, no harsh cymbals, no cinematic drums.

Prompt Variante C:
- Text: Minimal lounge piece for woodland UI. Rhodes + subtle pizzicato strings, mellow marimba accents, soft tape hiss, light wood percussions (claves/woodblock). Smooth, friendly, slightly whimsical. Instrumental, loop‑ready, 74 BPM, F major.
- Negative: no EDM elements, no aggressive transitions.

Dateiname Vorschlag:
- music/menu_forest_elevator_v1.mp3 (und v2, v3)

---

## 2) Musik – Run (treibend, actiongeladen)

Charakter: rhythmisch vorwärts, pulsierend, dunkel‑organisch, dennoch „Wald‑Code“: Holz‑Percussion, Shaker, dezente „Insekten“-Hi‑Hats. Instrumental, klare Energie, ohne schrille Spitzen.

Empfohlene Suno‑Parameter:
- Duration: 90–150s
- Style: instrumental, action, electronic hybrid, percussive
- BPM: 120–140 (empf. 132)
- Key: a‑Moll oder d‑Moll
- Ending: loopable, optional kleiner „re‑intro“ am Ende

Prompt Variante A:
- Text: Driving action track for a forest night chase. Pulsing analog bass arpeggio, tight tribal drums (tom/taiko flavor), crisp shaker like cicadas, staccato string ostinato layers. Dark but not harsh, energetic forward motion. Instrumental only, loopable form. 132 BPM, A minor.
- Negative: no vocals, no dubstep drops, no heavy distortion guitars.

Prompt Variante B:
- Text: Percussive electro‑organic run theme. Deep synth bass, kinetic wood/clave patterns, granular ticks like insect wings, dynamic snare fills, subtle glitch hats, periodic intensity swells. Instrumental, loop‑ready, 128 BPM, D minor.
- Negative: no vocals, no bright trance leads, no big room EDM.

Prompt Variante C:
- Text: Hybrid action groove in a shadowy grove. Low cello pulses, analog bass, layered toms, crisp hi‑hat chirps (insectoid), sparse metallic hits, occasional reverse swells. Instrumental, loopable, 136 BPM, A minor.
- Negative: no vocals, no epic brass, no cinematic risers at ending.

Dateiname Vorschlag:
- music/run_forest_chase_v1.mp3 (und v2, v3)

---

## 3) Soundeffekte – Kernliste mit Prompt‑Vorlagen (ElevenLabs SFX oder Alternativen)

Empfohlenes Tool:
- ElevenLabs Sound Effects (präzise Text‑to‑SFX, 44.1 kHz/48 kHz WAV)
Alternativen:
- Stable Audio SFX, AudioSparx (Such‑/Lizenz), sfxr/jsfxr (retro bleeps), Ableton/Logic Synth + Layering, Audacity/Freac für Nachbearbeitung.

Hinweise:
- Ziel‑Format: WAV, 44.1kHz oder 48kHz, 16/24bit
- Lautheit: -16 bis -14 LUFS für UI, -12 bis -10 LUFS für Kampf‑SFX; komprimiert, aber nicht „crushed“
- Tail/Loop: Für Loops nahtlos trimmen; kurze Fades (2–5ms)

Bezeichnungen und Prompts:

UI/Meta
- ui/button_hover
  - Prompt: Subtle wood chime tick, very short, soft, warm, wooden texture, no reverb tail.
  - Dauer: 0.15–0.25s
- ui/button_click
  - Prompt: Small woody click with gentle chime layer, soft transient, no metallic harshness.
  - Dauer: 0.2–0.3s
- ui/upgrade_open
  - Prompt: Soft ascending gliss with wind chime sparkle, magical but restrained, wooden overtones.
  - Dauer: 0.5–0.8s

Ambience
- amb/forest_night_loop
  - Prompt: Calm forest night ambience, soft crickets/cicadas, distant wind through leaves, no birds, low noise floor, seamless loop.
  - Dauer: 30–60s (Loop)
- amb/dense_grove_loop
  - Prompt: Darker woodland ambience, deeper insect hum, distant branches creak, subtle, seamless loop.
  - Dauer: 30–60s

Player
- player/move_wing_loop
  - Prompt: Gentle insect wing buzz loop, steady, warm, not harsh, low mid emphasis, seamless loop.
  - Dauer: 1–3s (Loop)
- player/parry_activate
  - Prompt: Short luminous pulse, glassy shimmer + soft whoosh, bright then fade, magical shield feel.
  - Dauer: 0.3–0.6s
- player/parry_reflect
  - Prompt: Crisp ping with radiant sparkle tail, hint of wood chime, immediate and satisfying.
  - Dauer: 0.25–0.4s
- player/hit
  - Prompt: Soft but alarming thud + brief sting, organic, no gore, slight wood resonance.
  - Dauer: 0.2–0.35s
- player/death
  - Prompt: Falling glow collapse: descending airy tone + subtle crackle, short, respectful.
  - Dauer: 0.6–1.0s
- player/shield_ready
  - Prompt: Tiny ascending chime arpeggio, clear, positive, very short.
  - Dauer: 0.25–0.4s
- player/spark_pickup
  - Prompt: Bright, tiny twinkle with soft wood click, magical, very short, stacks well.
  - Dauer: 0.12–0.2s

Enemies
- enemy/spawn
  - Prompt: Subtle materializing flutter, quick, slight shimmer, not sci‑fi, organic.
  - Dauer: 0.25–0.5s
- enemy/death_small
  - Prompt: Soft pop + de‑sparkle, wooden dust fall, brief, not explosive.
  - Dauer: 0.25–0.5s
- enemy/death_medium
  - Prompt: Slightly heavier pop, brief crackle, faint wind down, organic, not metallic.
  - Dauer: 0.35–0.6s
- enemy/teleport
  - Prompt: Phase shift flicker with airy whoosh, short glitch sprinkle, soft tail.
  - Dauer: 0.25–0.45s
- enemy/dash
  - Prompt: Quick low swoosh, compressed, hints of wing thrust, no high fizz.
  - Dauer: 0.2–0.35s
- enemy/missile_launch
  - Prompt: Small organic thunk + narrow whoosh, light, not military, insect‑tech feel.
  - Dauer: 0.3–0.5s
- enemy/homing_lock
  - Prompt: Short wooden‑click tick with faint tonal beep, subtle, non‑annoying.
  - Dauer: 0.15–0.25s
- enemy/sniper_charge
  - Prompt: Tight, quiet charge up: thin tonal rise, restrained, brief.
  - Dauer: 0.3–0.6s

Waves/Events
- wave/start
  - Prompt: Brief low swell + wood chime accent, indicates start, positive but tense.
  - Dauer: 0.4–0.7s
- wave/clear
  - Prompt: Gentle multi‑chime flourish, bright, satisfying, short tail.
  - Dauer: 0.5–0.9s
- boss/intro
  - Prompt: Darker organic drum hit + low tonal swell, woodland menace, short, cinematic hint.
  - Dauer: 0.8–1.2s

---

## 4) Produktions‑Checklist & Dateistruktur

- Lautstärke normalisieren (RMS/LUFS), Peaks bei -1 dBFS, kurze Fades an Loops
- Stereo ok; für UI‑Klicks ggf. mono
- Benennung:
  - public/audio/music/menu_forest_elevator_v1.mp3
  - public/audio/music/run_forest_chase_v1.mp3
  - public/audio/sfx/ui/button_click.wav
  - public/audio/sfx/player/parry_activate.wav
  - public/audio/amb/forest_night_loop.wav
- Variants: _v1, _v2, _v3
- Lizenz/Attribution gemäß Generator klären, Mastering (EQ/Comp) im Mix prüfen.

---

## 5) Kontrast Leitplanken (Menü vs. Run)

- Menü: warm, freundlich, „hölzerne“ Klangfarben, niedrige Dynamik, lofi/ambient/lounge
- Run: dunkler, pulsierend, tribal/organic Percussion + analoge Bässe, klarer Drive, dennoch nicht hart oder schrill
- Gemeinsame DNA: „Wald/Glühwürmchen“ durch Holz‑Percussion, leise Glocken/Chimes, Insekten‑artige Hi‑Hats/Schaker

Diese Prompts sind sofort in Suno.ai (Musik) und ElevenLabs Sound Effects (SFX) nutzbar. Nach Generierung einfach in die oben vorgeschlagene Ordnerstruktur legen; die spätere Audio‑Integration in den Code kann darauf aufbauen.
