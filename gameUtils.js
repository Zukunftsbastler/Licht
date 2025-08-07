// Game utility functions

// Distance calculation
export function distance(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
}

// Collision detection between two circles
export function circleCollision(a, b, radiusA, radiusB) {
  return distance(a, b) < (radiusA + radiusB)
}

// Normalize vector
export function normalize(vector) {
  const mag = Math.sqrt(vector.x ** 2 + vector.y ** 2)
  if (mag === 0) return { x: 0, y: 0 }
  return { x: vector.x / mag, y: vector.y / mag }
}

// Create particle effect
export function createParticle(x, y, color, velocity = { x: 0, y: 0 }) {
  return {
    x,
    y,
    vx: velocity.x + (Math.random() - 0.5) * 100,
    vy: velocity.y + (Math.random() - 0.5) * 100,
    size: Math.random() * 3 + 1,
    color,
    alpha: 1,
    life: 1,
    decay: Math.random() * 0.02 + 0.01
  }
}

// Update particle
export function updateParticle(particle, deltaTime) {
  particle.x += particle.vx * deltaTime
  particle.y += particle.vy * deltaTime
  particle.life -= particle.decay
  particle.alpha = Math.max(0, particle.life)
  particle.size *= 0.99
  
  return particle.life > 0
}

// Create light spark
export function createLightSpark(x, y) {
  return {
    x: x + (Math.random() - 0.5) * 20,
    y: y + (Math.random() - 0.5) * 20,
    collected: false,
    pulse: Math.random() * Math.PI * 2
  }
}

// Reflect projectile off parry shield
export function reflectProjectile(projectile, player) {
  const dx = projectile.x - player.x
  const dy = projectile.y - player.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  if (dist > 0) {
    const normalX = dx / dist
    const normalY = dy / dist
    
    // Reflect velocity
    const dot = projectile.vx * normalX + projectile.vy * normalY
    projectile.vx = projectile.vx - 2 * dot * normalX
    projectile.vy = projectile.vy - 2 * dot * normalY
    
    // Increase speed slightly
    const speed = Math.sqrt(projectile.vx ** 2 + projectile.vy ** 2)
    const newSpeed = speed * 1.2
    projectile.vx = (projectile.vx / speed) * newSpeed
    projectile.vy = (projectile.vy / speed) * newSpeed
    
    // Mark as reflected by player
    projectile.fromPlayer = true
    projectile.damage = 1
  }
}

// Check if point is inside canvas bounds
export function isInBounds(x, y, width, height, margin = 50) {
  return x >= -margin && x <= width + margin && y >= -margin && y <= height + margin
}

// Generate random position on canvas edge
export function getRandomEdgePosition(width, height) {
  const side = Math.floor(Math.random() * 4)
  
  switch (side) {
    case 0: // Top
      return { x: Math.random() * width, y: -50 }
    case 1: // Right
      return { x: width + 50, y: Math.random() * height }
    case 2: // Bottom
      return { x: Math.random() * width, y: height + 50 }
    case 3: // Left
      return { x: -50, y: Math.random() * height }
    default:
      return { x: width / 2, y: -50 }
  }
}

// Linear interpolation
export function lerp(a, b, t) {
  return a + (b - a) * t
}

// Clamp value between min and max
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

// Immobilize player
export function immobilizePlayer(player, duration) {
  player.speed = 0;
  setTimeout(() => {
    player.speed = 200; // Assuming 200 is the default player speed
  }, duration);
}

// Difficulty Score Calculation
function getOnTouchScore(onTouch) {
  switch (onTouch) {
    case 'damage':
      return 20;
    case 'immobilize':
      return 10;
    default:
      return 0;
  }
}

function getMovementTypeScore(type) {
  switch (type) {
    case 'homing':
      return 30;
    case 'teleport':
      return 20;
    case 'straight':
      return 10;
    default:
      return 0;
  }
}

function getAttackTypeScore(type) {
  switch (type) {
    case 'beam':
      return 50;
    case 'spread':
      return 40;
    case 'burst':
      return 30;
    case 'singleShot':
      return 10;
    default:
      return 0;
  }
}

function getProjectileTypeScore(type) {
  switch (type) {
    case 'penetrating':
      return 40;
    case 'homing':
      return 30;
    case 'enlarging':
      return 20;
    default:
      return 10;
  }
}

function calculateProjectileScore(projectile) {
  if (!projectile) return 0;
  let score = 0;
  score += getProjectileTypeScore(projectile.type);
  score += projectile.speed * 0.2;
  score += projectile.damage * 10;
  if (projectile.visualEffect === 'blinking') {
    score += 10;
  }
  return score;
}

export function calculateEnemyScore(enemy) {
  let score = 0;

  // Body score
  score += enemy.body.radius * 0.5;
  score += enemy.body.health * 10;
  score += getOnTouchScore(enemy.body.onTouch);
  if (enemy.body.isSolid) score += 5;

  // Movement score
  score += getMovementTypeScore(enemy.movement.type);
  score += enemy.movement.speed * 0.5;

  // Appearance score
  if (enemy.appearance && !enemy.appearance.isVisible) {
    score += 40;
    if (enemy.appearance.fadeInOnAttack) {
      score -= 10;
    }
  }

  // Attack score
  score += getAttackTypeScore(enemy.attack.type);
  score += calculateProjectileScore(enemy.attack.projectile);
  score += (1000 / enemy.attack.fireRate) * 5;
  if (enemy.attack.type === 'burst') {
    score += enemy.attack.burstCount * 5;
  }
  if (enemy.attack.type === 'spread') {
    score += enemy.attack.spreadCount * 5;
  }

  // onDeath score
  if (enemy.onDeath) {
    if (enemy.onDeath.action === 'spawnEnemies') {
      score += 30;
      score += enemy.onDeath.spawnCount * 5;
      // This could be recursive if spawned enemies have scores too
    }
    if (enemy.onDeath.action === 'explode') {
      score += 20;
      score += enemy.onDeath.explosionRadius * 0.2;
      score += enemy.onDeath.explosionDamage * 10;
    }
  }

  // specialAbilities score
  if (enemy.specialAbilities) {
    if (enemy.specialAbilities.canSpawnEnemies) {
      score += 50;
    }
    if (enemy.specialAbilities.canBecomeInvisible) {
      score += 40;
    }
  }

  return score;
}

export function calculateWaveScore(enemies) {
  let totalScore = 0;
  for (const enemy of enemies) {
    totalScore += calculateEnemyScore(enemy);
  }
  return totalScore;
}
