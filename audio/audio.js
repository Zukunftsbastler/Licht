/**
 * Simple audio manager for music + SFX with graceful fallbacks.
 * - Looks for files under /audio/music and /audio/sfx (Vite public/ dir).
 * - Supports two music channels: 'menu' and 'run' with crossfade.
 * - SFX are loaded lazily on first play; missing assets are ignored silently.
 */
import { SFX_MANIFEST } from './sfx-manifest.js'

const DEBUG = true;

function encodePathPreserveSlashes(raw) {
  if (!raw) return raw;
  const parts = raw.split('/');
  // Keep leading "" for absolute path, encode each segment after the first
  return parts.map((seg, i) => (i === 0 ? seg : encodeURIComponent(seg))).join('/');
}

const music = {
  current: null,
  targetKind: null,
  channels: {
    menu: null,
    run: null,
  },
};

const sfxCache = new Map();
const activeSfx = new Set();
let audioUnlocked = false;

// Keep SFX elements attached to DOM to satisfy some browser policies
function getSfxContainer() {
  if (typeof document === 'undefined') return null;
  let el = document.getElementById('sfx-container');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sfx-container';
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.opacity = '0';
    el.style.width = '0';
    el.style.height = '0';
    document.body.appendChild(el);
  }
  return el;
}

let audioCtx = null;

/** Create or get a shared WebAudio context (for low-latency, reliable SFX). */
function getOrCreateCtx() {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) audioCtx = new Ctx();
    }
  } catch {}
  return audioCtx;
}

/** Cache for decoded SFX buffers (key -> AudioBuffer). */
const sfxBufferCache = new Map();

/** Load and decode SFX for a logical key using WebAudio. */
async function loadSfxBufferForKey(key) {
  const ctx = getOrCreateCtx();
  if (!ctx) return null;
  if (sfxBufferCache.has(key)) return sfxBufferCache.get(key);

  const cands = sfxCandidates(key);
  for (const raw of cands) {
    try {
      const url = encodePathPreserveSlashes(raw);
      const res = await fetch(url);
      if (!res.ok) continue;
      const arr = await res.arrayBuffer();
      const buf = await ctx.decodeAudioData(arr.slice(0));
      if (buf) {
        sfxBufferCache.set(key, buf);
        return buf;
      }
    } catch (e) {
      if (DEBUG) console.warn('[SFX] buffer load failed', raw, e);
    }
  }
  return null;
}

/** Try multiple candidate paths, resolve first playable Audio element. */
async function loadAudioAny(candidates, loop = false) {
  for (const raw of candidates) {
    try {
      const src = encodePathPreserveSlashes(raw);
      // Verify the asset exists to avoid 404s that cause play() rejections
      const res = await fetch(src, { method: 'HEAD' });
      if (!res.ok) {
        if (DEBUG) console.warn('[SFX] HEAD not ok', src, res.status);
        continue;
      }
      const a = new Audio(src);
      a.loop = loop;
      a.preload = 'auto';
      if (DEBUG) console.log('[SFX] candidate ok', src);
      return a;
    } catch (e) {
      if (DEBUG) console.warn('[SFX] candidate failed', raw, e);
      // next
    }
  }
  if (DEBUG) console.warn('[SFX] no candidate playable', candidates);
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
  try {
    const ctx = getOrCreateCtx();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
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

    // Preferred path: WebAudio (more reliable across browsers for rapid/overlapping SFX)
    try {
      const ctx = getOrCreateCtx();
      if (ctx) {
        const buffer = await loadSfxBufferForKey(key);
        if (buffer) {
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          if (typeof opts.rate === 'number') src.playbackRate.value = opts.rate;

          const gain = ctx.createGain();
          gain.gain.value = typeof opts.volume === 'number' ? opts.volume : 1.0;

          src.connect(gain).connect(ctx.destination);
          src.start(0);
          if (DEBUG) console.log('[SFX] play (webaudio)', key, 'vol=', gain.gain.value);
          return;
        }
      }
    } catch (e) {
      if (DEBUG) console.warn('[SFX] WebAudio path failed', key, e);
    }

    // Fallback: HTMLAudioElement
    let entry = sfxCache.get(key);
    if (!entry) {
      const cands = sfxCandidates(key);
      const audio = await loadAudioAny(cands, false);
      if (!audio) {
        if (DEBUG) console.warn('[SFX] not found', key, cands);
        return;
      }
      sfxCache.set(key, { audio });
      entry = { audio };
    }
    const { audio } = entry;
    const srcUrl = audio.currentSrc || audio.src;
    const node = new Audio(srcUrl);
    node.preload = 'auto';
    node.autoplay = true;
    node.muted = false;
    node.volume = typeof opts.volume === 'number' ? opts.volume : 1.0;
    if (typeof opts.rate === 'number' && node.playbackRate !== undefined) {
      node.playbackRate = opts.rate;
    }
    try { node.currentTime = 0; } catch {}

    const container = getSfxContainer();
    if (container) {
      try { container.appendChild(node); } catch {}
    }
    activeSfx.add(node);
    node.onended = node.onerror = () => {
      activeSfx.delete(node);
      try {
        if (node.parentNode) node.parentNode.removeChild(node);
      } catch {}
    };
    if (DEBUG) console.log('[SFX] play (htmlaudio)', key, node.src, 'vol=', node.volume);

    let played = false;
    try {
      await node.play();
      played = true;
    } catch (e) {
      if (DEBUG) console.warn('[SFX] play failed (html first try)', key, e);
    }
    if (!played) {
      await new Promise((resolve) => {
        const onReady = async () => {
          try { await node.play(); } catch (e2) {
            if (DEBUG) console.warn('[SFX] play failed (html retry)', key, e2);
          }
          resolve();
        };
        node.addEventListener('canplaythrough', onReady, { once: true });
        try { node.load(); } catch {}
      });
    }
  } catch (e) {
    if (DEBUG) console.warn('[SFX] exception', key, e);
  }
}
