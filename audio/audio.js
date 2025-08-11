/**
 * Simple audio manager for music + SFX with graceful fallbacks.
 * - Looks for files under /audio/music and /audio/sfx (Vite public/ dir).
 * - Supports two music channels: 'menu' and 'run' with crossfade.
 * - SFX are loaded lazily on first play; missing assets are ignored silently.
 */
import { SFX_MANIFEST } from './sfx-manifest.js'

const music = {
  current: null,
  targetKind: null,
  channels: {
    menu: null,
    run: null,
  },
};

const sfxCache = new Map();
let audioUnlocked = false;

/** Try multiple candidate paths, resolve first playable Audio element. */
async function loadAudioAny(candidates, loop = false) {
  for (const src of candidates) {
    try {
      const a = new Audio(src);
      a.loop = loop;
      a.preload = 'auto';
      // Try to fetch metadata quickly to detect 404 early
      await a.load?.();
      // Some browsers won't reject until play(); accept lazily.
      return a;
    } catch {
      // next
    }
  }
  return null;
}

function musicCandidates(kind) {
  if (kind === 'menu') {
    return [
      // If served from public/audio/...
      '/audio/music/menu_forest_elevator_v1.mp3',
      '/audio/music/menu_forest_elevator_v2.mp3',
      '/audio/music/menu_forest_elevator_v3.mp3',
      // If vite publicDir is set to "audio" (served at root)
      '/music/menu_forest_elevator_v1.mp3',
      '/music/menu_forest_elevator_v2.mp3',
      '/music/menu_forest_elevator_v3.mp3',
    ];
  }
  if (kind === 'run') {
    return [
      // If served from public/audio/...
      '/audio/music/run_forest_chase_v1.mp3',
      '/audio/music/run_forest_chase_v2.mp3',
      '/audio/music/run_forest_chase_v3.mp3',
      // If vite publicDir is set to "audio" (served at root)
      '/music/run_forest_chase_v1.mp3',
      '/music/run_forest_chase_v2.mp3',
      '/music/run_forest_chase_v3.mp3',
    ];
  }
  return [];
}

function sfxCandidates(key) {
  // Prefer explicit manifest entries (exact filenames with 11Labs suffixes)
  const manifest = SFX_MANIFEST?.[key];
  const paths = [];
  if (manifest && Array.isArray(manifest)) {
    for (const p of manifest) {
      // Also try alternative mount points in case publicDir differs
      paths.push(p);
      // If user moves audio/ to public root later, provide shortened fallbacks
      if (p.startsWith('/audio/')) {
        paths.push(p.replace('/audio/', '/'));
      }
    }
  }

  // Heuristic fallbacks for generic names
  const base = key;
  const dashed = key.replace(/\//g, '-');
  const noslash = key.replace(/\//g, '');
  const colon = key.replace(/\//g, ':');
  const underscored = key.replace(/\//g, '_');
  const variants = [base, dashed, noslash, colon, underscored];

  for (const v of variants) {
    paths.push(`/audio/sfx/${v}.wav`, `/audio/sfx/${v}.mp3`);
    paths.push(`/audio/sfx/11L-${v}.wav`, `/audio/sfx/11L-${v}.mp3`);
  }
  for (const v of variants) {
    paths.push(`/sfx/${v}.wav`, `/sfx/${v}.mp3`);
    paths.push(`/sfx/11L-${v}.wav`, `/sfx/11L-${v}.mp3`);
  }
  return paths;
}

/** Unlock audio after a user gesture (best-effort). */
export function unlockAudio() {
  if (audioUnlocked) return;
  try {
    const a = new Audio();
    a.muted = true;
    a.play().catch(() => {});
  } catch {}
  audioUnlocked = true;
}

/** Initialize music channels (lazy). */
async function ensureMusic(kind) {
  if (!music.channels[kind]) {
    const a = await loadAudioAny(musicCandidates(kind), true);
    if (a) {
      a.volume = 0;
      music.channels[kind] = a;
    }
  }
  return music.channels[kind];
}

/** Crossfade between menu/run over duration ms. */
async function crossfade(toKind, duration = 800) {
  if (music.targetKind === toKind) return;
  music.targetKind = toKind;

  const to = await ensureMusic(toKind);
  if (!to) return;

  const fromKind = music.current === to ? null : (music.current && (music.current === music.channels.menu ? 'menu' : 'run'));
  const from = music.current && music.current !== to ? music.current : null;

  try {
    unlockAudio();
    if (to.paused) await to.play();
  } catch {}

  const startFromVol = from ? from.volume : 0;
  const startToVol = to.volume;
  const maxToVol = 0.6; // music level

  const steps = Math.max(1, Math.floor(duration / 50));
  let i = 0;

  if (from && from !== to) {
    // ensure from is playing to fade out smoothly
    try { if (from.paused) await from.play(); } catch {}
  }

  if (music.current !== to) music.current = to;

  const tick = () => {
    i++;
    const t = Math.min(1, i / steps);
    if (from) {
      from.volume = startFromVol * (1 - t);
    }
    to.volume = startToVol + (maxToVol - startToVol) * t;

    if (t < 1) {
      setTimeout(tick, 50);
    } else {
      if (from && from !== to) {
        from.pause();
        from.currentTime = 0;
        from.volume = 0;
      }
      to.volume = maxToVol;
    }
  };
  tick();
}

/** External: play menu or run music with crossfade. */
export function playMusic(kind) {
  return crossfade(kind, 800);
}

/** External: stop all music. */
export function stopMusic() {
  Object.values(music.channels).forEach((a) => {
    if (a) {
      a.pause();
      a.currentTime = 0;
      a.volume = 0;
    }
  });
  music.current = null;
  music.targetKind = null;
}

/** Play a short sound effect by key. */
export async function playSfx(key, opts = {}) {
  try {
    unlockAudio();
    let entry = sfxCache.get(key);
    if (!entry) {
      const audio = await loadAudioAny(sfxCandidates(key), false);
      if (!audio) return;
      sfxCache.set(key, { audio });
      entry = { audio };
    }
    const { audio } = entry;
    // Create a fresh HTMLAudioElement to allow overlapping plays (cloneNode may lose src)
    const node = new Audio(audio.currentSrc || audio.src);
    node.preload = 'auto';
    node.volume = typeof opts.volume === 'number' ? opts.volume : 0.9;
    if (typeof opts.rate === 'number' && node.playbackRate !== undefined) {
      node.playbackRate = opts.rate;
    }
    await node.play().catch(() => {});
  } catch {
    // ignore if missing or blocked
  }
}
