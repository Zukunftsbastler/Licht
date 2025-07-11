// Enemy system for Licht-Käfer Roguelite

import { distance, getRandomEdgePosition } from './gameUtils.js'

// Seeded random number generator for consistent colors
function seededRandom(seed) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Generate consistent color based on wave number
function getWaveColor(wave) {
  const colorWave = Math.floor((wave - 2) / 2) + 1 // Every 2 waves starting from wave 2
  const seed = colorWave * 12345 // Fixed seed multiplier
  
  const hue = Math.floor(seededRandom(seed) * 360)
  const saturation = 70 + Math.floor(seededRandom(seed + 1) * 30) // 70-100%
  const lightness = 40 + Math.floor(seededRandom(seed + 2) * 20) // 40-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

// Enemy types
export const ENEMY_TYPES = {
  SHADOW_MOTH: 'shadow_moth',
  DARK_CRAWLER: 'dark_crawler',
  VOID_SPITTER: 'void_spitter',
  ELITE_ENEMY: 'elite_enemy' // New elite enemy type
}

// Create enemy based on type
export function createEnemy(type, x, y, wave) {
  const baseEnemy = {
    x,
    y,
    type,
    health: 1,
    maxHealth: 1,
    speed: 50,
    size: 8,
    lastShot: 0,
    shootCooldown: 2000,
    targetX: x,
    targetY: y,
    moveTimer: 0,
    alive: true
  }

  switch (type) {
    case ENEMY_TYPES.SHADOW_MOTH:
      return {
        ...baseEnemy,
        health: 1 + Math.floor(wave / 3),
        maxHealth: 1 + Math.floor(wave / 3),
        speed: 30 + wave * 5,
        size: 10,
        shootCooldown: Math.max(1000, 2500 - wave * 100),
        color: '#ff0066',
        shadowColor: '#ff0066'
      }
    
    case ENEMY_TYPES.DARK_CRAWLER:
      return {
        ...baseEnemy,
        health: 2 + Math.floor(wave / 2),
        maxHealth: 2 + Math.floor(wave / 2),
        speed: 20 + wave * 3,
        size: 12,
        shootCooldown: Math.max(1500, 3000 - wave * 150),
        color: '#8800ff',
        shadowColor: '#8800ff'
      }
    
    case ENEMY_TYPES.VOID_SPITTER:
      return {
        ...baseEnemy,
        health: 3 + Math.floor(wave / 2),
        maxHealth: 3 + Math.floor(wave / 2),
        speed: 15 + wave * 2,
        size: 15,
        shootCooldown: Math.max(800, 2000 - wave * 80),
        color: '#ff3300',
        shadowColor: '#ff3300'
      }
    
    case ENEMY_TYPES.ELITE_ENEMY:
      const eliteWave = Math.floor((wave - 2) / 2) + 1 // Which elite generation
      const baseSpeed = 30 + wave * 5 // Base speed from shadow moth
      const eliteSpeed = baseSpeed * Math.pow(1.3, eliteWave) // 30% faster each generation
      
      return {
        ...baseEnemy,
        health: 2 + Math.floor(wave / 2),
        maxHealth: 2 + Math.floor(wave / 2),
        speed: eliteSpeed,
        size: 11,
        shootCooldown: Math.max(800, 2000 - wave * 120),
        color: getWaveColor(wave),
        shadowColor: getWaveColor(wave),
        isElite: true
      }
    
    default:
      return baseEnemy
  }
}

// Update enemy AI and behavior
export function updateEnemy(enemy, player, deltaTime, currentTime, canvasWidth, canvasHeight) {
  if (!enemy.alive) return enemy

  // Update movement timer
  enemy.moveTimer += deltaTime

  // Choose new target position every 2-4 seconds
  if (enemy.moveTimer > 2 + Math.random() * 2) {
    enemy.moveTimer = 0
    
    // Stay at edge of screen but move around
    const edge = Math.floor(Math.random() * 4)
    const margin = 100
    
    switch (edge) {
      case 0: // Top
        enemy.targetX = margin + Math.random() * (canvasWidth - 2 * margin)
        enemy.targetY = margin
        break
      case 1: // Right
        enemy.targetX = canvasWidth - margin
        enemy.targetY = margin + Math.random() * (canvasHeight - 2 * margin)
        break
      case 2: // Bottom
        enemy.targetX = margin + Math.random() * (canvasWidth - 2 * margin)
        enemy.targetY = canvasHeight - margin
        break
      case 3: // Left
        enemy.targetX = margin
        enemy.targetY = margin + Math.random() * (canvasHeight - 2 * margin)
        break
    }
  }

  // Move towards target position
  const dx = enemy.targetX - enemy.x
  const dy = enemy.targetY - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  if (dist > 5) {
    enemy.x += (dx / dist) * enemy.speed * deltaTime
    enemy.y += (dy / dist) * enemy.speed * deltaTime
  }

  // Shooting behavior
  if (currentTime - enemy.lastShot > enemy.shootCooldown) {
    enemy.lastShot = currentTime
    return { ...enemy, shouldShoot: true }
  }

  return { ...enemy, shouldShoot: false }
}

// Create projectile from enemy
export function createEnemyProjectile(enemy, player) {
  const dx = player.x - enemy.x
  const dy = player.y - enemy.y
  const dist = Math.sqrt(dx * dx + dy * dy)
  
  if (dist === 0) return null

  const speed = 120 + Math.random() * 60
  const spread = 0.1 // Add some inaccuracy
  const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * spread

  return {
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    fromPlayer: false,
    damage: 1,
    color: enemy.color || '#ff3333'
  }
}

// Damage enemy
export function damageEnemy(enemy, damage) {
  const newHealth = enemy.health - damage
  return {
    ...enemy,
    health: newHealth,
    alive: newHealth > 0
  }
}

// Wave configuration
export function getWaveConfig(wave) {
  // Base enemies increase by 1 each wave
  const baseEnemies = Math.min(2 + wave, 15)
  const enemies = []

  // Add elite enemies from previous waves (every 2 waves starting from wave 2)
  for (let eliteWave = 2; eliteWave < wave; eliteWave += 2) {
    enemies.push(ENEMY_TYPES.ELITE_ENEMY)
  }

  // Add new elite enemy every 2 waves starting from wave 2
  if (wave >= 2 && wave % 2 === 0) {
    enemies.push(ENEMY_TYPES.ELITE_ENEMY)
  }

  // Fill remaining slots with regular enemies
  const remainingSlots = baseEnemies - enemies.length

  if (wave <= 2) {
    // Wave 1-2: Only Shadow Moths
    for (let i = 0; i < remainingSlots; i++) {
      enemies.push(ENEMY_TYPES.SHADOW_MOTH)
    }
  } else if (wave <= 5) {
    // Wave 3-5: Moths and Crawlers
    const mothCount = Math.ceil(remainingSlots * 0.6)
    const crawlerCount = remainingSlots - mothCount
    
    for (let i = 0; i < mothCount; i++) {
      enemies.push(ENEMY_TYPES.SHADOW_MOTH)
    }
    for (let i = 0; i < crawlerCount; i++) {
      enemies.push(ENEMY_TYPES.DARK_CRAWLER)
    }
  } else {
    // Wave 6+: All enemy types
    const mothCount = Math.ceil(remainingSlots * 0.4)
    const crawlerCount = Math.floor(remainingSlots * 0.3)
    const spitterCount = remainingSlots - mothCount - crawlerCount
    
    for (let i = 0; i < mothCount; i++) {
      enemies.push(ENEMY_TYPES.SHADOW_MOTH)
    }
    for (let i = 0; i < crawlerCount; i++) {
      enemies.push(ENEMY_TYPES.DARK_CRAWLER)
    }
    for (let i = 0; i < spitterCount; i++) {
      enemies.push(ENEMY_TYPES.VOID_SPITTER)
    }
  }

  return {
    enemies,
    spawnDelay: Math.max(500, 2000 - wave * 100), // Time between enemy spawns
    waveBonus: wave * 50 // Bonus points for completing wave
  }
}

// Spawn enemies for wave
export function spawnWaveEnemies(wave, canvasWidth, canvasHeight) {
  const config = getWaveConfig(wave)
  const enemies = []
  let eliteIndex = 0

  config.enemies.forEach((enemyType, index) => {
    const spawnPos = getRandomEdgePosition(canvasWidth, canvasHeight)
    
    // For elite enemies, use their original wave for proper scaling
    let enemyWave = wave
    if (enemyType === ENEMY_TYPES.ELITE_ENEMY) {
      enemyWave = 2 + (eliteIndex * 2) // Wave 2, 4, 6, etc.
      eliteIndex++
    }
    
    const enemy = createEnemy(enemyType, spawnPos.x, spawnPos.y, enemyWave)
    
    // Stagger spawn times
    enemy.spawnDelay = index * config.spawnDelay
    enemy.spawned = false
    
    enemies.push(enemy)
  })

  return enemies
}

