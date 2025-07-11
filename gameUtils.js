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

