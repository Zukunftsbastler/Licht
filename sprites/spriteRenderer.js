/**
 * Sprite runtime for actors (player + enemies).
 * - 32x32 per frame, 4 frames horizontally (128x32 sheet)
 * - Front faces +X (right); we rotate by movement angle when drawing.
 * - Provides procedural fallback sheets if PNGs in /public are missing.
 */

const FRAME_W = 32;
const FRAME_H = 32;
const FRAMES = 4;

// Map actor id/type to public file path (if provided as real art later)
export const ACTOR_FILE_MAP = {
  player: '/sprites/actors/player.png',
  Irrlicht: '/sprites/actors/irrlicht.png',
  Raser: '/sprites/actors/raser.png',
  Pulsar: '/sprites/actors/pulsar.png',
  'Fächer-Klaue': '/sprites/actors/faecher-klaue.png',
  Zickzack: '/sprites/actors/zickzack.png',
  Streuer: '/sprites/actors/streuer.png',
  Schütze: '/sprites/actors/schuetze.png',
  Orbitant: '/sprites/actors/orbitant.png',
  Flimmer: '/sprites/actors/flimmer.png',
  Hetzer: '/sprites/actors/hetzer.png',
  Rammer: '/sprites/actors/rammer.png',
  Wächter: '/sprites/actors/boss_waechter.png',
  Fadenmeister: '/sprites/actors/boss_fadenmeister.png',
};

// Simple seeded RNG for procedural generation
function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToRGBA(hex, a = 1) {
  const c = hex.startsWith('#') ? hex.slice(1) : hex;
  const n = parseInt(c.length === 3 ? c.split('').map((x) => x + x).join('') : c, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${a})`;
}

function pickColorForType(type) {
  const palette = {
    player: '#ffff66',
    Irrlicht: '#ff0066',
    Raser: '#a020f0',
    Pulsar: '#8800ff',
    'Fächer-Klaue': '#ff3300',
    Zickzack: '#00bcd4',
    Streuer: '#ff8800',
    Schütze: '#66ccff',
    Orbitant: '#00ffaa',
    Flimmer: '#bbbbbb',
    Hetzer: '#33ff66',
    Rammer: '#ffaa33',
    Wächter: '#ff0044',
    Fadenmeister: '#bb00ff',
  };
  return palette[type] || '#cccccc';
}

// Draw a simple bug/creature base facing +X into a 32x32 tile
function drawBugFrame(ctx, type, baseColor, frameIndex, rng) {
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, FRAME_W, FRAME_H);

  // Background transparent
  // Body parameters
  const wobble = Math.sin((frameIndex / FRAMES) * Math.PI * 2) * 1.0;
  const wing = Math.sin((frameIndex / FRAMES) * Math.PI * 2) * 1.5;

  // Thorax/abdomen
  ctx.fillStyle = hexToRGBA(baseColor, 1);
  ctx.beginPath();
  ctx.ellipse(14, 16, 10, 8 + wobble, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head (front, towards +X)
  ctx.fillStyle = hexToRGBA('#222222', 1);
  ctx.beginPath();
  ctx.arc(22, 16, 5, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(24, 14, 2, 2);
  ctx.fillRect(24, 18, 2, 2);

  // Pupils (slight frame jiggle)
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(25, 14 + (frameIndex % 2), 1, 1);
  ctx.fillRect(25, 18 - (frameIndex % 2), 1, 1);

  // Antennae
  ctx.strokeStyle = '#dddddd';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(20, 14);
  ctx.lineTo(26, 10 + (frameIndex % 2));
  ctx.moveTo(20, 18);
  ctx.lineTo(26, 22 - (frameIndex % 2));
  ctx.stroke();

  // Wings (semi transparent)
  ctx.fillStyle = hexToRGBA('#99ccff', 0.4);
  ctx.beginPath();
  ctx.ellipse(12, 10 + wing, 8, 4, 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, 22 - wing, 8, 4, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Type accents (minimal differentiation)
  if (type === 'Rammer' || type === 'Wächter') {
    // Forehead plate
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(20, 12, 2, 8);
  } else if (type === 'Schütze') {
    // Target lens
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(22, 15, 3, 3);
  } else if (type === 'Orbitant') {
    // Side satellites
    ctx.fillStyle = '#00ffaa';
    ctx.fillRect(8, 8 + (frameIndex % 2), 2, 2);
    ctx.fillRect(8, 24 - (frameIndex % 2), 2, 2);
  } else if (type === 'Pulsar') {
    // Pulsing ring
    ctx.strokeStyle = hexToRGBA(baseColor, 0.6);
    ctx.beginPath();
    ctx.arc(14, 16, 5 + (frameIndex % 2), 0, Math.PI * 2);
    ctx.stroke();
  } else if (type === 'Zickzack') {
    // Lightning edges
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(6, 12 + (frameIndex % 2), 1, 8);
    ctx.fillRect(7, 12 + ((frameIndex + 2) % 2), 1, 8);
  } else if (type === 'Flimmer') {
    // Ghost offset
    ctx.fillStyle = hexToRGBA(baseColor, 0.3);
    ctx.fillRect(10 + (frameIndex % 2), 12, 6, 8);
  }
}

// Build a 128x32 sheet with 4 frames
function generateProceduralSheet(type) {
  const baseColor = pickColorForType(type);
  const seed = Array.from(type).reduce((a, c) => a + c.charCodeAt(0), 0);
  const rand = mulberry32(seed);

  const sheet = document.createElement('canvas');
  sheet.width = FRAME_W * FRAMES;
  sheet.height = FRAME_H;
  const sctx = sheet.getContext('2d');
  sctx.imageSmoothingEnabled = false;

  // temp tile canvas
  const tile = document.createElement('canvas');
  tile.width = FRAME_W;
  tile.height = FRAME_H;
  const tctx = tile.getContext('2d');

  for (let f = 0; f < FRAMES; f++) {
    tctx.clearRect(0, 0, FRAME_W, FRAME_H);
    drawBugFrame(tctx, type, baseColor, f, rand);
    sctx.drawImage(tile, f * FRAME_W, 0);
  }

  return sheet;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Load actor sprites, falling back to procedural sheets if files are missing.
 * @param {string[]} actorTypes
 * @returns {Promise<{actors: Record<string, {image: HTMLImageElement|HTMLCanvasElement, fw:number, fh:number, frames:number}>}>}
 */
export async function loadActorSprites(actorTypes) {
  const result = { actors: {} };
  await Promise.all(
    actorTypes.map(async (type) => {
      const path = ACTOR_FILE_MAP[type];
      if (path) {
        try {
          const img = await loadImage(path);
          result.actors[type] = { image: img, fw: FRAME_W, fh: FRAME_H, frames: FRAMES };
          return;
        } catch {
          // fall through to procedural
        }
      }
      const sheet = generateProceduralSheet(type);
      result.actors[type] = { image: sheet, fw: FRAME_W, fh: FRAME_H, frames: FRAMES };
    })
  );
  return result;
}

/**
 * Determine frame index from accumulated animTime and fps
 * @param {number} animTime seconds
 * @param {number} fps frames per second (e.g., 6..12)
 */
export function getFrameIndex(animTime = 0, fps = 8) {
  const t = Math.max(0, animTime);
  const idx = Math.floor(t * fps) % FRAMES;
  return idx;
}

/**
 * Draw a sprite with rotation at world position.
 * @param {CanvasRenderingContext2D} ctx
 * @param {{image: CanvasImageSource, fw:number, fh:number, frames:number}} sprite
 * @param {number} x
 * @param {number} y
 * @param {number} angle radians (0 = facing +X)
 * @param {number} frameIndex 0..3
 * @param {number} size target world size (pixels), sprite scaled uniformly
 */
export function drawSprite(ctx, sprite, x, y, angle = 0, frameIndex = 0, size = FRAME_W) {
  const { image, fw, fh } = sprite || {};
  if (!image) return;

  const scale = size / fw;
  const sx = (frameIndex % FRAMES) * fw;
  const sy = 0;

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.drawImage(
    image,
    sx,
    sy,
    fw,
    fh,
    -(fw * scale) / 2,
    -(fh * scale) / 2,
    fw * scale,
    fh * scale
  );
  ctx.restore();
}
