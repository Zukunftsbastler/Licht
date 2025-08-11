import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import MainMenu from './components/game/MainMenu.jsx'
import PermanentUpgradesScreen from './components/game/PermanentUpgradesScreen.jsx'
import UpgradeScreen from './components/game/UpgradeScreen.jsx'
import GameOverScreen from './components/game/GameOverScreen.jsx'
import Game from './components/game/Game.jsx'
import { 
  distance, 
  createParticle, 
  createLightSpark, 
  reflectProjectile,
  isInBounds,
  immobilizePlayer
} from './gameUtils.js'
import {
  updateEnemy,
  createEnemyProjectile,
  damageEnemy,
  spawnWaveEnemies,
  ENEMY_TEMPLATES
} from './enemySystem.js'
import { loadActorSprites, drawSprite, getFrameIndex } from './sprites/spriteRenderer.js'
import { generateForestBackgroundCanvas } from './background/generator.js'
import { playMusic, playSfx, unlockAudio } from './audio/audio.js'
import {
  generateUpgradeOptions,
  applyUpgrade,
  calculateUpgradeEffects
} from './upgradeSystem.js'
import { metaNodes } from './skillTree/metaTree.js'
import { getNodeCost, canBuy, purchase, indexById } from './skillTree/engine.js'
import './App.css'

const initialPermanentUpgrades = {
  shieldDuration: 0,
  sparkYield: 0,
  startHealth: 0,
  healthRegen: 0,
};

const initialTempUpgrades = {
  parry_size: 0,
  parry_duration: 0,
  double_sparks: 0,
  health_regen: 0,
  parry_cooldown: 0,
  spark_magnet: 0,
  extra_health: 0,
};

// Meta Skill-Tree initial state
const initialMetaProgress = {};
const initialMetaStats = { totalSparksSpent: 0, achievements: [] };

// Game constants
const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const PLAYER_SIZE = 12
const PLAYER_SPEED = 200
const PARRY_COOLDOWN = 500
const PARRY_DURATION = 250
const PARRY_RADIUS = 40

// Game states
const GAME_STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  UPGRADE_SELECTION: 'upgrade_selection',
  GAME_OVER: 'game_over',
  PERMANENT_UPGRADES: 'permanent_upgrades'
}

function App() {
  const canvasRef = useRef(null)
  const gameLoopRef = useRef(null)
  const lastTimeRef = useRef(0)
  
  // Game state
  const [gameState, setGameState] = useState(GAME_STATES.MENU)
  const [score, setScore] = useState(0)
  const [wave, setWave] = useState(1)
  const [lightSparks, setLightSparks] = useState(0)
  const [totalLightSparks, setTotalLightSparks] = useState(() => {
    return parseInt(localStorage.getItem('totalLightSparks') || '0')
  })
  
  // Wave management
  const [waveEnemies, setWaveEnemies] = useState([])
  const [currentWaveEnemies, setCurrentWaveEnemies] = useState([])
  const [waveStartTime, setWaveStartTime] = useState(0)
  const [killedEnemies, setKilledEnemies] = useState([])
  const [waveComplete, setWaveComplete] = useState(false)
  
  // Player state
  const [player, setPlayer] = useState({
    x: CANVAS_WIDTH / 2,
    y: CANVAS_HEIGHT / 2,
    health: 3,
    maxHealth: 3,
    speed: PLAYER_SPEED,
    parryActive: false,
    parryCooldown: 0,
    parryCooldownDuration: 0,
    parryRadius: PARRY_RADIUS,
    parryDuration: PARRY_DURATION,
    dirAngle: 0,
    animTime: 0,
    size: PLAYER_SIZE
  })
  
  // Game objects
  const [enemies, setEnemies] = useState([])
  const [projectiles, setProjectiles] = useState([])
  const [sparks, setSparks] = useState([])
  const [particles, setParticles] = useState([])
  
  // Mouse position
  const [mousePos, setMousePos] = useState({ x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 })
  
  // Permanent upgrades
  const [permanentUpgrades, setPermanentUpgrades] = useState(() => {
    const saved = localStorage.getItem('permanentUpgrades')
    return saved ? JSON.parse(saved) : { ...initialPermanentUpgrades }
  })
  
  // Temporary upgrades (for current run)
  const [tempUpgrades, setTempUpgrades] = useState({ ...initialTempUpgrades })

  // Meta Skill-Tree state
  const [metaProgress, setMetaProgress] = useState(() => {
    const saved = localStorage.getItem('metaProgress')
    return saved ? JSON.parse(saved) : { ...initialMetaProgress }
  })
  const [metaStats, setMetaStats] = useState(() => {
    const saved = localStorage.getItem('metaStats')
    return saved ? JSON.parse(saved) : { ...initialMetaStats }
  })

  const metaNodeIndex = useMemo(() => indexById(metaNodes), [])

  const metaEffects = useMemo(() => {
    const ml = (id) => (metaProgress[id] || 0);
    return {
      maxHealthBonus: ml('core_hp'),
      pickupRadiusBonus: ml('utility_magnet') * 2,
      econDropMultiplier: 1 + ml('econ_collector') * 0.05,
      permaRegenBonus: ml('regen'),
    };
  }, [metaProgress])
  
  // Upgrade selection
  const [upgradeOptions, setUpgradeOptions] = useState([])
  // Assets
  const [spriteAssets, setSpriteAssets] = useState(null)
  const [bgCanvas, setBgCanvas] = useState(null)

  // Save permanent upgrades to localStorage
  useEffect(() => {
    localStorage.setItem('permanentUpgrades', JSON.stringify(permanentUpgrades))
  }, [permanentUpgrades])

  // Save total light sparks to localStorage
  useEffect(() => {
    localStorage.setItem('totalLightSparks', totalLightSparks.toString())
  }, [totalLightSparks])

  useEffect(() => {
    localStorage.setItem('metaProgress', JSON.stringify(metaProgress))
  }, [metaProgress])

  useEffect(() => {
    localStorage.setItem('metaStats', JSON.stringify(metaStats))
  }, [metaStats])

  useEffect(() => {
    // Preload sprites and generate background once
    const actorTypes = ['player', ...new Set(Object.values(ENEMY_TEMPLATES).map(t => t.body?.type).filter(Boolean))]
    loadActorSprites(actorTypes).then(setSpriteAssets)
    const { canvas } = generateForestBackgroundCanvas(CANVAS_WIDTH, CANVAS_HEIGHT, 20250811)
    setBgCanvas(canvas)
  }, [])
  
  // Ensure audio is unlocked on first real user gesture (helps SFX on some browsers)
  useEffect(() => {
    const unlockOnce = () => {
      try { unlockAudio(); } catch {}
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
    window.addEventListener('pointerdown', unlockOnce, { passive: true });
    window.addEventListener('keydown', unlockOnce, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
  }, [])
  
  // Music state binding
  useEffect(() => {
    if (gameState === GAME_STATES.PLAYING) {
      playMusic('run')
    } else if (gameState === GAME_STATES.UPGRADE_SELECTION) {
      playMusic('menu')
    } else {
      // MENU, PERMANENT_UPGRADES, GAME_OVER
      playMusic('menu')
    }
  }, [gameState])
  
  // Mouse move handler
  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const rect = canvas.getBoundingClientRect()
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    })
  }, [])

  // Mouse click handler (parry)
  const handleMouseClick = useCallback(() => {
    if (gameState !== GAME_STATES.PLAYING) return
    
    setPlayer(prev => {
      if (prev.parryCooldown <= 0 && !prev.parryActive) {
        // Calculate modified cooldown with upgrades
        const baseParryDuration = PARRY_DURATION * (1 + permanentUpgrades.shieldDuration * 0.3)
        const modifiedParryDuration = baseParryDuration * (1 + tempUpgrades.parry_duration * 0.1)
        console.log('Parry activated. Duration:', modifiedParryDuration);
        playSfx('player/parry_activate', { volume: 0.8 })
        
        return {
          ...prev,
          parryActive: true,
          parryDuration: modifiedParryDuration,
          parryStartTime: performance.now(),
          parryCooldownDuration: 0
        }
      }
      return prev
    })
  }, [gameState, permanentUpgrades.shieldDuration, tempUpgrades.parry_duration])

  const startNewGame = () => {
    localStorage.removeItem('totalLightSparks');
    localStorage.removeItem('permanentUpgrades');
    localStorage.removeItem('metaProgress');
    localStorage.removeItem('metaStats');
    setTotalLightSparks(0);
    setPermanentUpgrades({ ...initialPermanentUpgrades });
    setMetaProgress({ ...initialMetaProgress });
    setMetaStats({ ...initialMetaStats });
    
    setTimeout(() => {
      startGame();
    }, 0);
  };

  // Start new game
  const startGame = () => {
    setGameState(GAME_STATES.PLAYING)
    setScore(0)
    setWave(1)
    setLightSparks(0)
    setKilledEnemies([])
    setWaveComplete(false)
    setWaveStartTime(performance.now())
    playSfx('wave/start', { volume: 0.6 })
    
    // Reset all temporary (run) upgrades BEFORE computing player stats
    const resetTempUpgrades = { ...initialTempUpgrades }
    setTempUpgrades(resetTempUpgrades)
    
    const baseHealth = 3 + Math.floor(permanentUpgrades.startHealth * 0.75) + (metaEffects.maxHealthBonus || 0)
    const extraHealth = resetTempUpgrades.extra_health || 0
    const totalHealth = baseHealth + extraHealth
    
    setPlayer({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      health: totalHealth,
      maxHealth: totalHealth,
      speed: PLAYER_SPEED,
      parryActive: false,
      parryCooldown: 0,
      parryCooldownDuration: 0,
      parryRadius: PARRY_RADIUS,
      parryDuration: PARRY_DURATION * (1 + permanentUpgrades.shieldDuration * 0.3),
      parryStartTime: 0,
      dirAngle: 0,
      animTime: 0,
      size: PLAYER_SIZE
    })
    
    // Initialize first wave
    const firstWaveEnemies = spawnWaveEnemies(1, CANVAS_WIDTH, CANVAS_HEIGHT)
    setWaveEnemies(firstWaveEnemies)
    setCurrentWaveEnemies(firstWaveEnemies)
    setEnemies([])
    setProjectiles([])
    setSparks([])
    setParticles([])
    setUpgradeOptions([])
  }

  // Game over
  const gameOver = useCallback(() => {
    setGameState(GAME_STATES.GAME_OVER)
    setTotalLightSparks(prev => prev + lightSparks)
  }, [lightSparks])

  // Select upgrade and continue to next wave
  const selectUpgrade = (upgradeType) => {
    const newTempUpgrades = applyUpgrade(tempUpgrades, upgradeType)
    setTempUpgrades(newTempUpgrades)
    
    if (upgradeType === 'extra_health') {
      setPlayer(prev => ({
        ...prev,
        health: prev.health + 1,
        maxHealth: prev.maxHealth + 1
      }))
    }
    
    const nextWave = wave + 1
    setWave(nextWave)
    setKilledEnemies([])
    setWaveComplete(false)
    setWaveStartTime(performance.now())
    playSfx(nextWave % 5 === 0 ? 'boss/intro' : 'wave/start', { volume: nextWave % 5 === 0 ? 0.8 : 0.6 })
    
    const nextWaveEnemies = spawnWaveEnemies(nextWave, CANVAS_WIDTH, CANVAS_HEIGHT)
    setWaveEnemies(nextWaveEnemies)
    setCurrentWaveEnemies(nextWaveEnemies)
    setEnemies([])
    
    setGameState(GAME_STATES.PLAYING)
  }

  // Buy permanent upgrade
  const buyPermanentUpgrade = (upgradeType) => {
    const costs = {
      shieldDuration: (permanentUpgrades.shieldDuration + 1) * 10,
      sparkYield: (permanentUpgrades.sparkYield + 1) * 15,
      startHealth: (permanentUpgrades.startHealth + 1) * 20,
      healthRegen: (permanentUpgrades.healthRegen + 1) * 25
    }
    
    const cost = costs[upgradeType]
    if (!cost || totalLightSparks < cost) return
    
    setTotalLightSparks(prev => prev - cost)
    setPermanentUpgrades(prev => ({
      ...prev,
      [upgradeType]: prev[upgradeType] + 1
    }))
  }

  // Buy meta skill tree node
  const buyMetaNode = (nodeId) => {
    const node = metaNodeIndex[nodeId]
    if (!node) return

    const ctx = {
      totalLightSparks,
      totalSparksSpent: metaStats?.totalSparksSpent || 0,
      achievements: metaStats?.achievements || []
    }

    const check = canBuy(node, metaProgress, ctx)
    if (!check.ok) return

    const cost = getNodeCost(node, metaProgress, ctx)
    if (totalLightSparks < cost) return

    setTotalLightSparks(prev => prev - cost)
    setMetaProgress(prev => purchase(prev, nodeId, node.maxLevel))
    setMetaStats(prev => ({
      ...prev,
      totalSparksSpent: (prev.totalSparksSpent || 0) + cost
    }))
  }

  // Render function
  const render = useCallback((currentTime) => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    if (bgCanvas) {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(bgCanvas, 0, 0)
    } else {
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
    
    if (gameState === GAME_STATES.PLAYING) {
      sparks.forEach(spark => {
        const pulseSize = 3 + Math.sin(spark.pulse) * 1
        ctx.fillStyle = '#00ffff'
        ctx.shadowColor = '#00ffff'
        ctx.shadowBlur = 10 + Math.sin(spark.pulse) * 5
        ctx.beginPath()
        ctx.arc(spark.x, spark.y, pulseSize, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })
      
      enemies.forEach(enemy => {
        const type = enemy.body?.type;
        const sprite = spriteAssets?.actors?.[type];
        if (sprite) {
          const frame = getFrameIndex(enemy.animTime || 0, 8);
          const angle = enemy.dirAngle || 0;
          const size = (enemy.body?.radius || 10) * 2;
          drawSprite(ctx, sprite, enemy.x, enemy.y, angle, frame, size);
        } else {
          ctx.fillStyle = enemy.body.color;
          ctx.shadowColor = enemy.body.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(enemy.x, enemy.y, enemy.body.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });
      
      projectiles.forEach(projectile => {
        ctx.fillStyle = projectile.color;
        ctx.shadowColor = projectile.color;
        ctx.shadowBlur = 6;
        if (projectile.visualEffect === 'blinking') {
          ctx.globalAlpha = Math.abs(Math.sin(performance.now() / 100));
        }
        ctx.beginPath();
        ctx.arc(projectile.x, projectile.y, projectile.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.shadowBlur = 0;
      });
      
      const pr = player.size || PLAYER_SIZE
      const pSprite = spriteAssets?.actors?.['player']
      if (pSprite) {
        const pFrame = getFrameIndex(player.animTime || 0, 10)
        const pAngle = player.dirAngle || 0
        drawSprite(ctx, pSprite, player.x, player.y, pAngle, pFrame, pr * 2)
      } else {
        ctx.fillStyle = '#ffff00'
        ctx.shadowColor = '#ffff00'
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.arc(player.x, player.y, pr, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      }
      
      const healthBarWidth = 40
      const healthBarHeight = 6
      const healthBarX = player.x - healthBarWidth / 2
      const healthBarY = player.y - pr - 15
      
      ctx.fillStyle = '#333333'
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)
      
      const healthPercentage = player.health / player.maxHealth
      const healthFillWidth = healthBarWidth * healthPercentage
      
      if (healthPercentage > 0.6) {
        ctx.fillStyle = '#00ff00'
      } else if (healthPercentage > 0.3) {
        ctx.fillStyle = '#ffff00'
      } else {
        ctx.fillStyle = '#ff0000'
      }
      
      ctx.fillRect(healthBarX, healthBarY, healthFillWidth, healthBarHeight)
      
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 1
      ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight)

      // Draw Parry/Cooldown bar and handle shield transparency
      const parryBarY = healthBarY + healthBarHeight + 4;
      if (player.parryActive) {
        const elapsed = currentTime - player.parryStartTime;
        const percentage = Math.max(0, 1 - (elapsed / player.parryDuration));

        // Draw shield circle
        const radius = player.parryRadius * (1 + tempUpgrades.parry_size * 0.05);
        ctx.globalAlpha = percentage; // Set transparency
        ctx.strokeStyle = '#00ffff';
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1; // Reset transparency
      } else if (player.parryCooldown > 0 && player.parryCooldownDuration > 0) {
        const percentage = player.parryCooldown / player.parryCooldownDuration;
        ctx.fillStyle = '#552222'; // Background
        ctx.fillRect(healthBarX, parryBarY, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#ff3333'; // Fill
        ctx.fillRect(healthBarX, parryBarY, healthBarWidth * percentage, healthBarHeight);
      }
      
      particles.forEach(particle => {
        ctx.fillStyle = particle.color
        ctx.shadowColor = particle.color
        ctx.shadowBlur = 5
        ctx.globalAlpha = particle.alpha
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.globalAlpha = 1
        ctx.shadowBlur = 0
      })
    }
  }, [gameState, player, enemies, projectiles, sparks, particles, tempUpgrades, spriteAssets, bgCanvas])

  // Game loop
  const gameLoop = useCallback((currentTime) => {
    const deltaTime = (currentTime - lastTimeRef.current) / 1000
    lastTimeRef.current = currentTime
    
    if (gameState === GAME_STATES.PLAYING) {
      setPlayer(prev => {
        let { parryActive, parryCooldown, parryDuration, parryStartTime, parryCooldownDuration } = prev;

        if (parryActive) {
          const parryElapsed = currentTime - parryStartTime;
          if (parryElapsed >= parryDuration) {
            parryActive = false;
            const modifiedParryCooldown = PARRY_COOLDOWN * (1 - tempUpgrades.parry_cooldown * 0.15);
            parryCooldown = modifiedParryCooldown;
            parryCooldownDuration = modifiedParryCooldown;
            console.log('Parry deactivated. Cooldown started:', modifiedParryCooldown);
          }
        } else {
          parryCooldown = Math.max(0, parryCooldown - deltaTime * 1000);
        }

        const dx = mousePos.x - prev.x;
        const dy = mousePos.y - prev.y;
        let dirAngle = prev.dirAngle || 0;
        const moveDist = Math.hypot(dx, dy);
        if (moveDist > 0.001) {
          dirAngle = Math.atan2(dy, dx);
        }
        const speedPixPerSec = moveDist / Math.max(deltaTime, 1e-6);
        const animInc = deltaTime * (0.6 + Math.min(2, speedPixPerSec / 80));

        const newPlayer = {
          ...prev,
          x: mousePos.x,
          y: mousePos.y,
          parryCooldown,
          parryCooldownDuration,
          parryActive,
          dirAngle,
          animTime: (prev.animTime || 0) + animInc,
        };
        
        const permaRegenStacks = (permanentUpgrades.healthRegen || 0) + (metaEffects.permaRegenBonus || 0)
        if (permaRegenStacks > 0 && newPlayer.health < newPlayer.maxHealth) {
          const regenInterval = 3000 / permaRegenStacks
          if (currentTime % regenInterval < deltaTime * 1000) {
            newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + 1)
          }
        }
        
        if (tempUpgrades.health_regen > 0 && newPlayer.health < newPlayer.maxHealth) {
          const tempRegenInterval = 5000 / tempUpgrades.health_regen
          if (currentTime % tempRegenInterval < deltaTime * 1000) {
            newPlayer.health = Math.min(newPlayer.maxHealth, newPlayer.health + 1)
          }
        }
        
        return newPlayer
      })
      
      setWaveEnemies(prev => {
        const newEnemies = []
        const remainingWaveEnemies = []
        
        prev.forEach(enemy => {
          if (!enemy.spawned && currentTime - waveStartTime > enemy.spawnDelay) {
            enemy.spawned = true
            playSfx('enemy/spawn', { volume: 0.35 })
            setEnemies(prevEnemies => [...prevEnemies, enemy])
          } else if (!enemy.spawned) {
            remainingWaveEnemies.push(enemy)
          }
        })
        
        return remainingWaveEnemies
      })
      
      setEnemies(prev => {
        const newProjectiles = []
        
        const updatedEnemies = prev.map(enemy => {
          const updated = updateEnemy(enemy, player, deltaTime, currentTime, CANVAS_WIDTH, CANVAS_HEIGHT)
          
          if (updated.shouldShoot) {
            const created = createEnemyProjectile(updated, player)
            if (Array.isArray(created)) {
              newProjectiles.push(...created)
            } else if (created) {
              newProjectiles.push(created)
            }
          }
          
          return updated
        }).filter(enemy => enemy.alive)
        
        if (newProjectiles.length > 0) {
          setProjectiles(prev => [...prev, ...newProjectiles])
        }
        
        return updatedEnemies
      })
      
      if (enemies.length === 0 && waveEnemies.length === 0 && !waveComplete) {
        setWaveComplete(true)
        setScore(prev => prev + wave * 50)
        
        const options = generateUpgradeOptions(tempUpgrades, wave)
        setUpgradeOptions(options)
        playSfx('wave/clear', { volume: 0.7 })
        playSfx('ui/upgrade_open', { volume: 0.6 })
        
        setTimeout(() => {
          setGameState(GAME_STATES.UPGRADE_SELECTION)
        }, 1500)
      }
      
      setProjectiles(prev => {
        return prev.map(projectile => {
          let vx = projectile.vx
          let vy = projectile.vy

          if (projectile.homing && !projectile.fromPlayer) {
            const dx = player.x - projectile.x
            const dy = player.y - projectile.y
            const dist = Math.hypot(dx, dy) || 1
            const speed = Math.hypot(vx, vy) || (projectile.speed || 140)
            const nx = dx / dist
            const ny = dy / dist
            const strength = projectile.homingStrength || 0.06

            vx = vx + (nx * speed - vx) * strength
            vy = vy + (ny * speed - vy) * strength

            const mag = Math.hypot(vx, vy) || 1
            vx = (vx / mag) * speed
            vy = (vy / mag) * speed
          }

          return {
            ...projectile,
            vx,
            vy,
            x: projectile.x + vx * deltaTime,
            y: projectile.y + vy * deltaTime
          }
        }).filter(projectile =>
          isInBounds(projectile.x, projectile.y, CANVAS_WIDTH, CANVAS_HEIGHT)
        )
      })
      
      setParticles(prev => 
        prev.map(particle => ({
          ...particle,
          x: particle.x + particle.vx * deltaTime,
          y: particle.y + particle.vy * deltaTime,
          life: particle.life - particle.decay,
          alpha: Math.max(0, particle.life),
          size: particle.size * 0.99
        })).filter(particle => particle.life > 0)
      )
      
      setSparks(prev => 
        prev.map(spark => ({
          ...spark,
          pulse: spark.pulse + deltaTime * 5
        }))
      )
      
      setProjectiles(prev => {
        const newProjectiles = []
        const newParticles = []
        const newSparks = []
        let playerHit = false
        
        prev.forEach(projectile => {
          let projectileDestroyed = false
          
          if (player.parryActive && !projectile.fromPlayer) {
            const upgradeEffects = calculateUpgradeEffects(tempUpgrades)
            const parryRadius = player.parryRadius * upgradeEffects.parrySizeMultiplier
            if (distance(projectile, player) < parryRadius) {
              reflectProjectile(projectile, player)
              playSfx('player/parry_reflect', { volume: 0.7 })
              
              for (let i = 0; i < 5; i++) {
                newParticles.push(createParticle(
                  projectile.x, 
                  projectile.y, 
                  '#00ffff',
                  { x: projectile.vx * 0.1, y: projectile.vy * 0.1 }
                ))
              }
              
              newSparks.push(createLightSpark(projectile.x, projectile.y))
              
              setScore(prev => prev + 10)
            }
          }
          
          if (projectile.fromPlayer) {
            setEnemies(prevEnemies => {
              return prevEnemies.map(enemy => {
                if (distance(projectile, enemy) < enemy.body.radius + projectile.radius) {
                  projectileDestroyed = true;

                  for (let i = 0; i < 6; i++) {
                    newParticles.push(
                      createParticle(enemy.x, enemy.y, enemy.body.color)
                    );
                  }

                  const damagedEnemy = damageEnemy(enemy, projectile.damage);

                  if (!damagedEnemy.alive && enemy.alive) {
                    const deathKey = (enemy.body?.radius || 10) >= 12 ? 'enemy/death_medium' : 'enemy/death_small';
                    playSfx(deathKey, { volume: 0.7 });
                    setKilledEnemies(prev => [...prev, damagedEnemy.id]);
                    setScore(prev => prev + 25);

                    const baseSparkCount = 2;
                    const sparkMultiplier = (1 + permanentUpgrades.sparkYield * 1.5) * (metaEffects.econDropMultiplier || 1);
                    const totalSparks = Math.floor(
                      baseSparkCount * sparkMultiplier
                    );

                    for (let i = 0; i < totalSparks; i++) {
                      newSparks.push(createLightSpark(enemy.x, enemy.y));
                    }
                  }

                  return damagedEnemy;
                }
                return enemy;
              });
            });
          }
          
          if (!projectile.fromPlayer && !player.parryActive) {
            if (distance(projectile, player) < PLAYER_SIZE + projectile.radius) {
              if (projectile.type !== 'penetrating') {
                playerHit = true;
                projectileDestroyed = true;
              }

              if (projectile.onHitEffect === 'enlargePlayer') {
                setPlayer(prev => ({
                  ...prev,
                  size: prev.size * 1.5,
                }));
                setTimeout(() => {
                  setPlayer(prev => ({
                    ...prev,
                    size: PLAYER_SIZE,
                  }));
                }, projectile.enlargeDuration);
              }

              for (let i = 0; i < 8; i++) {
                newParticles.push(
                  createParticle(player.x, player.y, projectile.color)
                );
              }
            }
          }
          
          if (!projectileDestroyed) {
            newProjectiles.push(projectile)
          }
        })
        
        if (playerHit) {
          playSfx('player/hit', { volume: 0.8 })
          setPlayer(prev => {
            const newHealth = prev.health - 1
            if (newHealth <= 0) {
              setTimeout(() => gameOver(), 100)
            }
            return { ...prev, health: newHealth }
          })
        }
        
        if (newParticles.length > 0) {
          setParticles(prev => [...prev, ...newParticles])
        }
        
        if (newSparks.length > 0) {
          setSparks(prev => [...prev, ...newSparks])
        }
        
        return newProjectiles
      })
      
      setSparks(prev => {
        const newSparks = []
        let sparksCollected = 0
        
        const baseCollectionRange = 20 + (metaEffects.pickupRadiusBonus || 0)
        const magnetRange = baseCollectionRange + (tempUpgrades.spark_magnet * 15)
        
        prev.forEach(spark => {
          const distanceToPlayer = distance(spark, player)
          
          if (tempUpgrades.spark_magnet > 0 && distanceToPlayer < magnetRange && distanceToPlayer > baseCollectionRange) {
            const magnetStrength = 0.1 * tempUpgrades.spark_magnet
            const dx = player.x - spark.x
            const dy = player.y - spark.y
            const dist = Math.sqrt(dx * dx + dy * dy)
            
            spark.x += (dx / dist) * magnetStrength * deltaTime * 1000
            spark.y += (dy / dist) * magnetStrength * deltaTime * 1000
          }
          
          if (!spark.collected && distanceToPlayer < baseCollectionRange) {
            sparksCollected++
            
            for (let i = 0; i < 3; i++) {
              setParticles(prev => [...prev, createParticle(
                spark.x, 
                spark.y, 
                '#00ffff'
              )])
            }
          } else {
            newSparks.push(spark)
          }
        })
        
        if (sparksCollected > 0) {
          const doubleSparkChance = tempUpgrades.double_sparks * 0.1
          const multiplier = Math.random() < doubleSparkChance ? 2 : 1
          setLightSparks(prev => prev + sparksCollected * multiplier)
          setScore(prev => prev + sparksCollected * 5 * multiplier)
          playSfx('player/spark_pickup', { volume: 0.5 })
        }
        
        return newSparks
      })
    }
    
    render(currentTime)
    gameLoopRef.current = requestAnimationFrame(gameLoop)
  }, [gameState, mousePos, render, player, tempUpgrades, gameOver, enemies, waveEnemies, waveStartTime, wave, waveComplete])

  // Start game loop
  useEffect(() => {
    gameLoopRef.current = requestAnimationFrame(gameLoop)
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current)
      }
    }
  }, [gameLoop])

  // Player-enemy collision
  useEffect(() => {
    if (gameState !== GAME_STATES.PLAYING) return;

    let playerHealthLoss = 0;
    let scoreToAdd = 0;
    const sparksToAdd = [];
    const enemiesToUpdate = new Map();

    enemies.forEach(enemy => {
      if (enemy.alive && distance(player, enemy) < PLAYER_SIZE + enemy.body.radius) {
        if (player.parryActive) {
          const damagedEnemy = damageEnemy(enemy, 100); // Instantly kill the enemy
          enemiesToUpdate.set(enemy, damagedEnemy);

          if (!damagedEnemy.alive && enemy.alive) {
            const deathKey = (enemy.body?.radius || 10) >= 12 ? 'enemy/death_medium' : 'enemy/death_small';
            playSfx(deathKey, { volume: 0.7 });
            setKilledEnemies(prev => [...prev, damagedEnemy.id]);
            scoreToAdd += 25;

            const baseSparkCount = 2;
            const sparkMultiplier = (1 + permanentUpgrades.sparkYield * 1.5) * (metaEffects.econDropMultiplier || 1);
            const totalSparks = Math.floor(baseSparkCount * sparkMultiplier);

            for (let i = 0; i < totalSparks; i++) {
              sparksToAdd.push(createLightSpark(enemy.x, enemy.y));
            }
          }
        } else {
          switch (enemy.body.onTouch) {
            case 'damage':
              playerHealthLoss++;
              break;
            case 'immobilize':
              immobilizePlayer(player, 2000);
              break;
            default:
              break;
          }
        }
      }
    });

    if (enemiesToUpdate.size > 0) {
      setEnemies(prevEnemies =>
        prevEnemies.map(e => enemiesToUpdate.get(e) || e)
      );
    }

    if (sparksToAdd.length > 0) {
      setSparks(prev => [...prev, ...sparksToAdd]);
    }
    
    if (scoreToAdd > 0) {
      setScore(prev => prev + scoreToAdd);
    }

    if (playerHealthLoss > 0) {
      setPlayer(prev => {
        const newHealth = prev.health - playerHealthLoss;
        if (newHealth <= 0 && prev.health > 0) { // Ensure gameOver is called only once
          setTimeout(() => gameOver(), 100);
        }
        return { ...prev, health: newHealth };
      });
    }
  }, [enemies, gameState, player, permanentUpgrades.sparkYield, gameOver]);

  // Event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('click', handleMouseClick)
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('click', handleMouseClick)
    }
  }, [handleMouseMove, handleMouseClick])

  const renderGameState = () => {
    switch (gameState) {
      case GAME_STATES.MENU:
        return <MainMenu 
          onStartGame={startGame}
          onStartNewGame={startNewGame}
          onShowUpgrades={() => setGameState(GAME_STATES.PERMANENT_UPGRADES)}
          totalLightSparks={totalLightSparks}
          permanentUpgrades={permanentUpgrades}
        />;
      case GAME_STATES.PLAYING:
        return <Game 
          player={player}
          wave={wave}
          score={score}
          lightSparks={lightSparks}
          permanentUpgrades={permanentUpgrades}
          tempUpgrades={tempUpgrades}
          canvasRef={canvasRef}
          canvasWidth={CANVAS_WIDTH}
          canvasHeight={CANVAS_HEIGHT}
          enemies={enemies}
          currentWaveEnemies={currentWaveEnemies}
          killedEnemies={killedEnemies}
        />;
      case GAME_STATES.UPGRADE_SELECTION:
        return <UpgradeScreen 
          wave={wave}
          onSelectUpgrade={selectUpgrade}
          upgradeOptions={upgradeOptions}
        />;
      case GAME_STATES.GAME_OVER:
        return <GameOverScreen 
          wave={wave}
          score={score}
          lightSparks={lightSparks}
          onRestart={startGame}
          onShowUpgrades={() => setGameState(GAME_STATES.PERMANENT_UPGRADES)}
          onBackToMenu={() => setGameState(GAME_STATES.MENU)}
          totalLightSparks={totalLightSparks}
        />;
      case GAME_STATES.PERMANENT_UPGRADES:
        return <PermanentUpgradesScreen 
          onBackToMenu={() => setGameState(GAME_STATES.MENU)}
          onBuyUpgrade={buyPermanentUpgrade}
          totalLightSparks={totalLightSparks}
          permanentUpgrades={permanentUpgrades}
          metaProgress={metaProgress}
          metaStats={metaStats}
          onBuyMetaNode={buyMetaNode}
        />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      {renderGameState()}
    </div>
  )
}

export default App
