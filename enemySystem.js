// Enemy system for Licht-Käfer Roguelite

import { distance, getRandomEdgePosition, getRandomInsidePosition, calculateEnemyScore } from './gameUtils.js'

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

// Projectile types
export const PROJECTILE_TYPES = {
  NORMAL: {
    type: 'normal',
    speed: 150,
    damage: 1,
    radius: 5,
    color: '#ff3333',
    visualEffect: 'none',
    onHitEffect: 'none',
  },
  PENETRATING: {
    type: 'penetrating',
    speed: 220,
    damage: 1,
    radius: 6,
    color: '#ffffff',
    visualEffect: 'blinking',
    onHitEffect: 'none',
  },
  ENLARGING: {
    type: 'enlarging',
    speed: 200,
    damage: 0,
    radius: 7,
    color: '#00ff00',
    visualEffect: 'none',
    onHitEffect: 'enlargePlayer',
    enlargeDuration: 10000,
  },
  HOMING: {
    type: 'homing',
    speed: 140,
    damage: 1,
    radius: 5,
    color: '#33ff66',
    homing: true,
    homingStrength: 0.06,
    visualEffect: 'none',
    onHitEffect: 'none',
  },
  HEAVY: {
    type: 'normal',
    speed: 280,
    damage: 2,
    radius: 7,
    color: '#ffcc00',
    visualEffect: 'none',
    onHitEffect: 'none',
  },
}

// Enemy templates
export const ENEMY_TEMPLATES = {
  // Existing, kept and augmented
  BASIC: {
    body: {
      type: 'Irrlicht',
      radius: 10,
      health: 1,
      color: '#ff0066',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'straight',
      speed: 50,
    },
    attack: {
      type: 'singleShot',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 2000,
    },
  },
  FAST: {
    body: {
      type: 'Raser',
      radius: 8,
      health: 1,
      color: 'purple',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'homing',
      speed: 100,
    },
    attack: {
      type: 'singleShot',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 1500,
    },
  },
  BURST: {
    body: {
      type: 'Pulsar',
      radius: 12,
      health: 2,
      color: '#8800ff',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'still',
      speed: 0,
    },
    attack: {
      type: 'burst',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 3000,
      burstCount: 3,
      burstDelay: 200,
    },
  },
  SPREAD: {
    body: {
      type: 'Fächer-Klaue',
      radius: 15,
      health: 3,
      color: '#ff3300',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'straight',
      speed: 30,
    },
    attack: {
      type: 'spread',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 2500,
      spreadCount: 8,
      spreadAngle: 45,
    },
  },

  // New variations
  ZIGZAG: {
    body: {
      type: 'Zickzack',
      radius: 10,
      health: 1,
      color: '#00bcd4',
      onTouch: 'damage',
      isSolid: false,
    },
    movement: {
      type: 'zigzag',
      speed: 70,
      amplitude: 60,
      frequency: 2.0,
    },
    attack: {
      type: 'singleShot',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 1800,
    },
  },
  SHOTGUNNER: {
    body: {
      type: 'Streuer',
      radius: 14,
      health: 2,
      color: '#ff8800',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'straight',
      speed: 40,
    },
    attack: {
      type: 'shotgunCone',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 2200,
      spreadCount: 6,
      spreadAngle: 60, // degrees
    },
  },
  SNIPER: {
    body: {
      type: 'Schütze',
      radius: 10,
      health: 1,
      color: '#66ccff',
      onTouch: 'damage',
      isSolid: false,
    },
    movement: {
      type: 'still',
      speed: 0,
    },
    attack: {
      type: 'singleShot',
      projectile: PROJECTILE_TYPES.PENETRATING,
      fireRate: 1600,
    },
  },
  ORBITER: {
    body: {
      type: 'Orbitant',
      radius: 12,
      health: 2,
      color: '#00ffaa',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'orbit',
      speed: 60,
      orbitRadius: 170,
    },
    attack: {
      type: 'spread',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 3000,
      spreadCount: 6,
    },
  },
  TELEPORTER: {
    body: {
      type: 'Flimmer',
      radius: 11,
      health: 1,
      color: '#bbbbbb',
      onTouch: 'damage',
      isSolid: false,
    },
    movement: {
      type: 'teleport',
      speed: 0,
      teleportInterval: 2200,
    },
    attack: {
      type: 'burst',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 2200,
      burstCount: 3,
    },
  },
  MISSILE_LAUNCHER: {
    body: {
      type: 'Hetzer',
      radius: 13,
      health: 2,
      color: '#33ff66',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'straight',
      speed: 35,
    },
    attack: {
      type: 'homingMissile',
      projectile: PROJECTILE_TYPES.HOMING,
      fireRate: 2500,
    },
  },
  DASHER: {
    body: {
      type: 'Rammer',
      radius: 12,
      health: 2,
      color: '#ffaa33',
      onTouch: 'damage',
      isSolid: true,
    },
    movement: {
      type: 'dash',
      speed: 180,
      dashDuration: 400,
      dashCooldown: 1800,
    },
    attack: {
      type: 'singleShot',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 1400,
    },
  },

  // Bosses
  BOSS_WARDEN: {
    body: {
      type: 'Wächter',
      radius: 28,
      health: 12,
      color: '#ff0044',
      onTouch: 'damage',
      isSolid: true,
      boss: true,
    },
    movement: {
      type: 'dash',
      speed: 160,
      dashDuration: 500,
      dashCooldown: 1400,
    },
    attack: {
      type: 'spiral',
      projectile: PROJECTILE_TYPES.NORMAL,
      fireRate: 800,
      spreadCount: 10,
    },
  },
  BOSS_WEAVER: {
    body: {
      type: 'Fadenmeister',
      radius: 26,
      health: 10,
      color: '#bb00ff',
      onTouch: 'damage',
      isSolid: true,
      boss: true,
    },
    movement: {
      type: 'orbit',
      speed: 80,
      orbitRadius: 200,
    },
    attack: {
      type: 'shotgunCone',
      projectile: PROJECTILE_TYPES.PENETRATING,
      fireRate: 900,
      spreadCount: 9,
      spreadAngle: 90,
    },
  },
}

// Create enemy from a template
export function createEnemy(template, x, y, wave) {
  // Deep-ish copy to avoid mutating templates
  const enemy = {
    body: { ...template.body },
    movement: { ...template.movement },
    attack: { ...template.attack },
    id: Math.random(),
    x,
    y,
    wave,
    lastShot: 0,
    targetX: x,
    targetY: y,
    moveTimer: 0,
    alive: true,
    spawned: true,
  }

  // Initialize per-type state
  enemy.orbitAngle = 0
  enemy.zigzagPhase = Math.random() * Math.PI * 2
  enemy.dashTime = 0
  enemy.dashCooldownTimer = 0
  enemy.teleportTimer = 0
  enemy.attack._spiralAngle = 0

  // Scale enemy stats with wave number
  if (enemy.body.boss) {
    enemy.body.health += Math.floor(wave * 1.5)
    enemy.movement.speed += wave * 3
    enemy.attack.fireRate = Math.max(300, enemy.attack.fireRate - wave * 30)
  } else {
    enemy.body.health += Math.floor(wave / 3)
    enemy.movement.speed += wave * 2
    enemy.attack.fireRate = Math.max(500, enemy.attack.fireRate - wave * 50)
  }

  // Compute difficulty score for HUD
  try {
    enemy.difficulty = Math.round(calculateEnemyScore(enemy))
  } catch {
    enemy.difficulty = 0
  }

  return enemy
}

// Update enemy AI and behavior
export function updateEnemy(enemy, player, deltaTime, currentTime, canvasWidth, canvasHeight) {
  if (!enemy.alive) return enemy

  // Movement
  switch (enemy.movement.type) {
    case 'still':
      // no movement
      break

    case 'homing': {
      const dx = player.x - enemy.x
      const dy = player.y - enemy.y
      const distHoming = Math.hypot(dx, dy)
      if (distHoming > 5) {
        enemy.x += (dx / distHoming) * enemy.movement.speed * deltaTime
        enemy.y += (dy / distHoming) * enemy.movement.speed * deltaTime
      }
      break
    }

    case 'zigzag': {
      // Move generally towards player with a perpendicular sinusoidal offset
      const dx = player.x - enemy.x
      const dy = player.y - enemy.y
      const dist = Math.hypot(dx, dy) || 1
      const nx = dx / dist
      const ny = dy / dist
      // perpendicular vector
      const px = -ny
      const py = nx

      enemy.moveTimer += deltaTime
      const offset = Math.sin(enemy.moveTimer * (enemy.movement.frequency || 2)) * (enemy.movement.amplitude || 60)

      const vx = nx * enemy.movement.speed + px * offset
      const vy = ny * enemy.movement.speed + py * offset

      enemy.x += vx * deltaTime
      enemy.y += vy * deltaTime
      break
    }

    case 'orbit': {
      const r = enemy.movement.orbitRadius || 160
      const angularSpeed = (enemy.movement.speed || 60) / 50 // tweak factor
      enemy.orbitAngle += angularSpeed * deltaTime
      enemy.x = player.x + Math.cos(enemy.orbitAngle) * r
      enemy.y = player.y + Math.sin(enemy.orbitAngle) * r
      break
    }

    case 'dash': {
      // Dash towards player periodically
      enemy.dashCooldownTimer -= deltaTime * 1000
      if (enemy.dashing) {
        enemy.dashTime += deltaTime * 1000
        const dx = player.x - enemy.x
        const dy = player.y - enemy.y
        const dist = Math.hypot(dx, dy) || 1
        const spd = (enemy.movement.speed || 160) * 1.5
        enemy.x += (dx / dist) * spd * deltaTime
        enemy.y += (dy / dist) * spd * deltaTime

        if (enemy.dashTime >= (enemy.movement.dashDuration || 500)) {
          enemy.dashing = false
          enemy.dashTime = 0
          enemy.dashCooldownTimer = enemy.movement.dashCooldown || 1500
        }
      } else {
        if (enemy.dashCooldownTimer <= 0) {
          enemy.dashing = true
          enemy.dashTime = 0
        } else {
          // idle drift along edges
          enemy.moveTimer += deltaTime
          if (enemy.moveTimer > 2 + Math.random() * 2) {
            enemy.moveTimer = 0
            const edge = Math.floor(Math.random() * 4)
            const margin = 100
            switch (edge) {
              case 0:
                enemy.targetX = margin + Math.random() * (canvasWidth - 2 * margin)
                enemy.targetY = margin
                break
              case 1:
                enemy.targetX = canvasWidth - margin
                enemy.targetY = margin + Math.random() * (canvasHeight - 2 * margin)
                break
              case 2:
                enemy.targetX = margin + Math.random() * (canvasWidth - 2 * margin)
                enemy.targetY = canvasHeight - margin
                break
              case 3:
                enemy.targetX = margin
                enemy.targetY = margin + Math.random() * (canvasHeight - 2 * margin)
                break
            }
          }
          const dx = enemy.targetX - enemy.x
          const dy = enemy.targetY - enemy.y
          const dist = Math.hypot(dx, dy)
          if (dist > 5) {
            enemy.x += (dx / dist) * (enemy.movement.speed * 0.5) * deltaTime
            enemy.y += (dy / dist) * (enemy.movement.speed * 0.5) * deltaTime
          }
        }
      }
      break
    }

    case 'teleport': {
      enemy.teleportTimer += deltaTime * 1000
      const interval = enemy.movement.teleportInterval || 2500
      if (enemy.teleportTimer >= interval) {
        enemy.teleportTimer = 0
        const pos = getRandomInsidePosition(canvasWidth, canvasHeight)
        enemy.x = pos.x
        enemy.y = pos.y
      }
      break
    }

    case 'straight':
    default: {
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
      const dist = Math.hypot(dx, dy)

      if (dist > 5) {
        enemy.x += (dx / dist) * enemy.movement.speed * deltaTime
        enemy.y += (dy / dist) * enemy.movement.speed * deltaTime
      }
      break
    }
  }

  // Shooting behavior
  if (currentTime - enemy.lastShot > enemy.attack.fireRate) {
    enemy.lastShot = currentTime
    return { ...enemy, shouldShoot: true }
  }

  return { ...enemy, shouldShoot: false }
}

// Create projectile(s) from enemy
export function createEnemyProjectile(enemy, player) {
  const projectileType = enemy.attack.projectile || PROJECTILE_TYPES.NORMAL
  const dx = player.x - enemy.x
  const dy = player.y - enemy.y
  const dist = Math.hypot(dx, dy)
  if (dist === 0) return null
  const angle = Math.atan2(dy, dx)

  // Helper to build a projectile at angle
  const makeProjectileAtAngle = (ang, type = projectileType) => ({
    ...type,
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(ang) * type.speed,
    vy: Math.sin(ang) * type.speed,
    fromPlayer: false,
  })

  switch (enemy.attack.type) {
    case 'singleShot': {
      return makeProjectileAtAngle(angle)
    }
    case 'burst': {
      const count = enemy.attack.burstCount || 3
      const spread = (enemy.attack.spreadAngle || 10) * (Math.PI / 180)
      const projs = []
      for (let i = 0; i < count; i++) {
        const offset = (Math.random() - 0.5) * spread
        projs.push(makeProjectileAtAngle(angle + offset))
      }
      return projs
    }
    case 'spread': {
      const count = enemy.attack.spreadCount || 8
      const projs = []
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2
        projs.push(makeProjectileAtAngle(a))
      }
      return projs
    }
    case 'shotgunCone': {
      const count = enemy.attack.spreadCount || 6
      const cone = (enemy.attack.spreadAngle || 60) * (Math.PI / 180)
      const projs = []
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1)
        const a = angle - cone / 2 + t * cone
        projs.push(makeProjectileAtAngle(a))
      }
      return projs
    }
    case 'spiral': {
      const count = enemy.attack.spreadCount || 10
      const base = enemy.attack._spiralAngle || 0
      const step = (Math.PI * 2) / count
      const projs = []
      for (let i = 0; i < count; i++) {
        projs.push(makeProjectileAtAngle(base + i * step))
      }
      // advance spiral angle for next shot
      enemy.attack._spiralAngle = base + (Math.PI / 6)
      return projs
    }
    case 'homingMissile': {
      // Single homing projectile
      const p = makeProjectileAtAngle(angle, projectileType.type === 'homing' ? projectileType : PROJECTILE_TYPES.HOMING)
      p.homing = true
      p.homingStrength = projectileType.homingStrength ?? 0.06
      p.color = projectileType.color || '#33ff66'
      return p
    }
    case 'beam': {
      // Approximate beam as a very fast heavy projectile
      const heavy = { ...PROJECTILE_TYPES.HEAVY, speed: 360, radius: 8, color: '#ffee00' }
      return makeProjectileAtAngle(angle, heavy)
    }
    default: {
      return makeProjectileAtAngle(angle)
    }
  }
}

// Damage enemy
export function damageEnemy(enemy, damage) {
  const newHealth = enemy.body.health - damage
  const newBody = { ...enemy.body, health: newHealth }
  return {
    ...enemy,
    body: newBody,
    alive: newHealth > 0,
  }
}

// Internal: compute a rough template difficulty (without wave scaling)
function computeTemplateDifficulty(template) {
  try {
    // Use template directly; calculateEnemyScore can handle template shape
    return Math.max(1, Math.round(calculateEnemyScore(template)))
  } catch {
    return 10
  }
}

// Wave configuration using difficulty budget
export function getWaveConfig(wave) {
  // Build catalog with base difficulties
  const poolKeys = [
    'BASIC',
    'FAST',
    'BURST',
    'SPREAD',
    'ZIGZAG',
    'SHOTGUNNER',
    'SNIPER',
    'ORBITER',
    'TELEPORTER',
    'MISSILE_LAUNCHER',
    'DASHER',
  ]

  const bossKeys = ['BOSS_WARDEN', 'BOSS_WEAVER']

  if (wave % 5 === 0) {
    // Boss wave: 1 boss + some minions
    const bossKey = bossKeys[Math.floor(Math.random() * bossKeys.length)]
    const bossTemplate = { ...ENEMY_TEMPLATES[bossKey] }

    // Add some support enemies
    const minions = []
    const minionCount = Math.min(4, 1 + Math.floor(wave / 5))
    for (let i = 0; i < minionCount; i++) {
      const k = poolKeys[Math.floor(Math.random() * poolKeys.length)]
      minions.push(ENEMY_TEMPLATES[k])
    }

    return {
      enemies: [bossTemplate, ...minions],
      spawnDelay: 800,
      waveBonus: wave * 80,
      isBossWave: true,
    }
  }

  // Regular wave uses a difficulty budget
  const baseBudget = 80 + wave * 35
  let budget = baseBudget

  // Precompute difficulties
  const catalog = poolKeys.map((k) => {
    const t = ENEMY_TEMPLATES[k]
    return { key: k, template: t, diff: computeTemplateDifficulty(t) }
  })

  const enemyTemplates = []
  // Always ensure at least a few enemies
  let safety = 50
  while (budget > 0 && enemyTemplates.length < 20 && safety-- > 0) {
    // Filter catalog to those affordable
    const affordable = catalog.filter((c) => c.diff <= budget)
    const pickFrom = affordable.length > 0 ? affordable : catalog
    const chosen = pickFrom[Math.floor(Math.random() * pickFrom.length)]
    enemyTemplates.push(chosen.template)
    budget -= chosen.diff
    // Prevent endless loop if budget very small
    if (budget < 10 && enemyTemplates.length >= 3) break
  }

  return {
    enemies: enemyTemplates,
    spawnDelay: Math.max(400, 1800 - wave * 80),
    waveBonus: wave * 50,
    isBossWave: false,
  }
}

// Spawn enemies for wave
export function spawnWaveEnemies(wave, canvasWidth, canvasHeight) {
  const config = getWaveConfig(wave)
  const enemies = []

  config.enemies.forEach((template, index) => {
    const movementType = template.movement.type
    const spawnInside = movementType === 'still' || movementType === 'teleport' || movementType === 'orbit'
    const spawnPos = spawnInside
      ? getRandomInsidePosition(canvasWidth, canvasHeight)
      : getRandomEdgePosition(canvasWidth, canvasHeight)

    const enemy = createEnemy(template, spawnPos.x, spawnPos.y, wave)

    // Stagger spawn times
    enemy.spawnDelay = index * config.spawnDelay
    enemy.spawned = false

    // Tint color slightly per wave for variety (keep explicit colors for bosses)
    if (!enemy.body.boss && enemy.body && enemy.body.color && enemy.body.color.startsWith('#')) {
      // optional: could blend with getWaveColor(wave)
      // leaving original color for clarity
    }

    enemies.push(enemy)
  })

  return enemies
}
