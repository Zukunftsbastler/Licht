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
    speed: 100,
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
};

// Enemy templates
export const ENEMY_TEMPLATES = {
  BASIC: {
    body: {
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
};

// Create enemy from a template
export function createEnemy(template, x, y, wave) {
  const enemy = {
    ...template,
    id: Math.random(),
    x,
    y,
    wave,
    lastShot: 0,
    targetX: x,
    targetY: y,
    moveTimer: 0,
    alive: true,
  };

  // Scale enemy stats with wave number
  enemy.body.health += Math.floor(wave / 3);
  enemy.movement.speed += wave * 2;
  enemy.attack.fireRate = Math.max(500, enemy.attack.fireRate - wave * 50);

  return enemy;
}

// Update enemy AI and behavior
export function updateEnemy(enemy, player, deltaTime, currentTime, canvasWidth, canvasHeight) {
  if (!enemy.alive) return enemy;

  // Movement
  switch (enemy.movement.type) {
    case 'still':
      break;
    case 'homing':
      const dxHoming = player.x - enemy.x;
      const dyHoming = player.y - enemy.y;
      const distHoming = Math.sqrt(dxHoming * dxHoming + dyHoming * dyHoming);
      if (distHoming > 5) {
        enemy.x += (dxHoming / distHoming) * enemy.movement.speed * deltaTime;
        enemy.y += (dyHoming / distHoming) * enemy.movement.speed * deltaTime;
      }
      break;
    case 'straight':
    default:
      // Update movement timer
      enemy.moveTimer += deltaTime;

      // Choose new target position every 2-4 seconds
      if (enemy.moveTimer > 2 + Math.random() * 2) {
        enemy.moveTimer = 0;

        // Stay at edge of screen but move around
        const edge = Math.floor(Math.random() * 4);
        const margin = 100;

        switch (edge) {
          case 0: // Top
            enemy.targetX = margin + Math.random() * (canvasWidth - 2 * margin);
            enemy.targetY = margin;
            break;
          case 1: // Right
            enemy.targetX = canvasWidth - margin;
            enemy.targetY = margin + Math.random() * (canvasHeight - 2 * margin);
            break;
          case 2: // Bottom
            enemy.targetX = margin + Math.random() * (canvasWidth - 2 * margin);
            enemy.targetY = canvasHeight - margin;
            break;
          case 3: // Left
            enemy.targetX = margin;
            enemy.targetY = margin + Math.random() * (canvasHeight - 2 * margin);
            break;
        }
      }

      // Move towards target position
      const dx = enemy.targetX - enemy.x;
      const dy = enemy.targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        enemy.x += (dx / dist) * enemy.movement.speed * deltaTime;
        enemy.y += (dy / dist) * enemy.movement.speed * deltaTime;
      }
      break;
  }

  // Shooting behavior
  if (currentTime - enemy.lastShot > enemy.attack.fireRate) {
    enemy.lastShot = currentTime;
    return { ...enemy, shouldShoot: true };
  }

  return { ...enemy, shouldShoot: false };
}

// Create projectile from enemy
export function createEnemyProjectile(enemy, player) {
  const projectileType = enemy.attack.projectile || PROJECTILE_TYPES.NORMAL;
  const dx = player.x - enemy.x;
  const dy = player.y - enemy.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist === 0) return null;

  const angle = Math.atan2(dy, dx);

  const projectile = {
    ...projectileType,
    x: enemy.x,
    y: enemy.y,
    vx: Math.cos(angle) * projectileType.speed,
    vy: Math.sin(angle) * projectileType.speed,
    fromPlayer: false,
  };

  return projectile;
}

// Damage enemy
export function damageEnemy(enemy, damage) {
  const newHealth = enemy.body.health - damage;
  const newBody = { ...enemy.body, health: newHealth };
  return {
    ...enemy,
    body: newBody,
    alive: newHealth > 0,
  };
}

// Wave configuration
export function getWaveConfig(wave) {
  const enemyCount = Math.min(2 + wave, 15);
  const enemyTemplates = [];

  if (wave % 5 === 0) {
    // Boss wave
    const boss = { ...ENEMY_TEMPLATES.SPREAD };
    boss.body.health *= 5;
    boss.body.radius *= 2;
    boss.attack.spreadCount = 16;
    enemyTemplates.push(boss);
  } else {
    // Regular wave
    for (let i = 0; i < enemyCount; i++) {
      const rand = Math.random();
      if (rand < 0.5) {
        enemyTemplates.push(ENEMY_TEMPLATES.BASIC);
      } else if (rand < 0.8) {
        enemyTemplates.push(ENEMY_TEMPLATES.FAST);
      } else {
        enemyTemplates.push(ENEMY_TEMPLATES.BURST);
      }
    }
  }

  return {
    enemies: enemyTemplates,
    spawnDelay: Math.max(500, 2000 - wave * 100),
    waveBonus: wave * 50,
  };
}

// Spawn enemies for wave
export function spawnWaveEnemies(wave, canvasWidth, canvasHeight) {
  const config = getWaveConfig(wave);
  const enemies = [];

  config.enemies.forEach((template, index) => {
    const spawnPos = getRandomEdgePosition(canvasWidth, canvasHeight);
    const enemy = createEnemy(template, spawnPos.x, spawnPos.y, wave);

    // Stagger spawn times
    enemy.spawnDelay = index * config.spawnDelay;
    enemy.spawned = false;

    enemies.push(enemy);
  });

  return enemies;
}
