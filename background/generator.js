/**
 * Generative pixel-forest background for Licht-Käfer.
 * Builds a single offscreen canvas (no runtime cost per frame).
 * Style: pixelated, dark forest, clusters of trees/bushes/grass, stones, webs, mushrooms.
 */

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function drawGrassNoise(ctx, w, h, rng) {
  // Subtle noisy grass pixels
  for (let i = 0; i < (w * h) / 8; i++) {
    const x = randInt(rng, 0, w - 1);
    const y = randInt(rng, 0, h - 1);
    const shades = ['#0a0f0a', '#0b120b', '#0c140c', '#0d160d'];
    ctx.fillStyle = pick(rng, shades);
    ctx.fillRect(x, y, 1, 1);
  }
}

function drawGrassBlades(ctx, w, h, rng) {
  // Sparse blades as 2-3 px lines
  ctx.imageSmoothingEnabled = false;
  const count = Math.floor((w * h) / 600);
  for (let i = 0; i < count; i++) {
    const x = randInt(rng, 0, w - 1);
    const y = randInt(rng, 0, h - 1);
    const len = randInt(rng, 1, 3);
    ctx.fillStyle = rng() < 0.5 ? '#0f2a0f' : '#103210';
    for (let j = 0; j < len; j++) ctx.fillRect(x, y - j, 1, 1);
  }
}

function drawStone(ctx, x, y, rng) {
  // Small rounded rock 3-6 px
  const w = randInt(rng, 3, 6);
  const h = randInt(rng, 2, 4);
  ctx.fillStyle = rng() < 0.5 ? '#3a3a42' : '#404048';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#565660';
  if (rng() < 0.7) ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
}

function drawMushroom(ctx, x, y, rng) {
  // Tiny glowing mushroom 2-3 px cap
  const colors = ['#8aff8a', '#88c4ff', '#ff8ae0', '#ffd966'];
  const cap = pick(rng, colors);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(x, y + 2, 1, 1); // stem
  ctx.fillStyle = cap;
  ctx.fillRect(x - 1, y + 1, 3, 1); // cap
  if (rng() < 0.5) ctx.fillRect(x, y, 1, 1);
}

function drawBush(ctx, x, y, rng) {
  // Pixel bush 8-14 px width
  const w = randInt(rng, 8, 14);
  const h = randInt(rng, 5, 8);
  const colors = ['#123c12', '#134213', '#154815', '#175017'];
  for (let i = 0; i < w; i++) {
    for (let j = 0; j < h; j++) {
      if (rng() < 0.7) {
        ctx.fillStyle = pick(rng, colors);
        ctx.fillRect(x + i, y + j, 1, 1);
      }
    }
  }
}

function drawTree(ctx, x, y, rng) {
  // Simple tree: trunk + crown blobs
  // Trunk
  ctx.fillStyle = '#4b2f1c';
  const trunkH = randInt(rng, 5, 10);
  ctx.fillRect(x, y, 2, trunkH);
  // Crown
  const crownW = randInt(rng, 10, 18);
  const crownH = randInt(rng, 6, 10);
  const cx = x - Math.floor(crownW / 2) + 1;
  const cy = y - crownH + 1;
  const greens = ['#183f18', '#1a461a', '#1c4e1c', '#1f541f'];
  for (let i = 0; i < crownW; i++) {
    for (let j = 0; j < crownH; j++) {
      if (rng() < 0.75) {
        ctx.fillStyle = pick(rng, greens);
        ctx.fillRect(cx + i, cy + j, 1, 1);
      }
    }
  }
  // Occasional highlight
  if (rng() < 0.3) {
    ctx.fillStyle = '#266826';
    ctx.fillRect(cx + randInt(rng, 2, crownW - 3), cy + randInt(rng, 1, crownH - 2), 2, 2);
  }
}

function drawWeb(ctx, x, y, rng) {
  // Spider web: thin white lines
  ctx.strokeStyle = '#bfbfbf';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const dx = randInt(rng, -8, 8);
    const dy = randInt(rng, -8, 8);
    ctx.moveTo(x, y);
    ctx.lineTo(x + dx, y + dy);
  }
  ctx.stroke();
  // Rings
  ctx.strokeStyle = '#9f9f9f';
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPuddle(ctx, x, y, rng) {
  const w = randInt(rng, 8, 16);
  const h = randInt(rng, 5, 10);
  ctx.fillStyle = '#0a1a1f';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#0c2228';
  if (rng() < 0.7) ctx.fillRect(x + 1, y + 1, Math.max(1, w - 2), Math.max(1, h - 2));
  // Specular sparkle
  if (rng() < 0.4) {
    ctx.fillStyle = '#1a3a44';
    ctx.fillRect(x + Math.floor(w / 2), y + 1, 2, 1);
  }
}

/**
 * Generate a single cached background canvas with pixel forest.
 * @param {number} width
 * @param {number} height
 * @param {number} seed
 * @returns {{canvas: HTMLCanvasElement, seed: number}}
 */
export function generateForestBackgroundCanvas(width, height, seed = 1337) {
  const rng = mulberry32(seed);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  ctx.imageSmoothingEnabled = false;

  // Base fill
  ctx.fillStyle = '#050805';
  ctx.fillRect(0, 0, width, height);

  drawGrassNoise(ctx, width, height, rng);
  drawGrassBlades(ctx, width, height, rng);

  // Place clusters: trees predominantly at edges, bushes mid, details everywhere
  const treeCount = Math.floor((width + height) / 8);
  for (let i = 0; i < treeCount; i++) {
    // Edge bias
    const edge = rng() < 0.5;
    const x = edge ? (rng() < 0.5 ? randInt(rng, 0, 40) : randInt(rng, width - 40, width - 1)) : randInt(rng, 0, width - 1);
    const y = edge ? randInt(rng, 0, height - 1) : (rng() < 0.5 ? randInt(rng, 0, 40) : randInt(rng, height - 40, height - 1));
    drawTree(ctx, x, y, rng);
  }

  const bushCount = Math.floor((width + height) / 10);
  for (let i = 0; i < bushCount; i++) {
    drawBush(ctx, randInt(rng, 10, width - 18), randInt(rng, 10, height - 12), rng);
  }

  const stoneCount = Math.floor((width + height) / 18);
  for (let i = 0; i < stoneCount; i++) {
    drawStone(ctx, randInt(rng, 0, width - 6), randInt(rng, 0, height - 4), rng);
  }

  const webCount = Math.floor((width + height) / 60);
  for (let i = 0; i < webCount; i++) {
    drawWeb(ctx, randInt(rng, 8, width - 8), randInt(rng, 8, height - 8), rng);
  }

  const mushroomCount = Math.floor((width + height) / 14);
  for (let i = 0; i < mushroomCount; i++) {
    drawMushroom(ctx, randInt(rng, 2, width - 3), randInt(rng, 2, height - 4), rng);
  }

  const puddleCount = Math.floor((width + height) / 50);
  for (let i = 0; i < puddleCount; i++) {
    drawPuddle(ctx, randInt(rng, 8, width - 16), randInt(rng, 8, height - 12), rng);
  }

  return { canvas, seed };
}
