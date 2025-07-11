import { useState, useEffect, useRef, useCallback } from 'react'
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
  isInBounds
} from './gameUtils.js'
import {
  updateEnemy,
  createEnemyProjectile,
  damageEnemy,
  spawnWaveEnemies
} from './enemySystem.js'
import {
  generateUpgradeOptions,
  applyUpgrade,
  calculateUpgradeEffects
} from './upgradeSystem.js'
import './App.css'

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
  const [waveStartTime, setWaveStartTime] = useState(0)
  const [enemiesKilled, setEnemiesKilled] = useState(0)
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
    parryRadius: PARRY_RADIUS,
    parryDuration: PARRY_DURATION
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
    return saved ? JSON.parse(saved) : {
      shieldDuration: 0,
      sparkYield: 0,
      startHealth: 0,
      healthRegen: 0
    }
  })
  
  // Temporary upgrades (for current run)
  const [tempUpgrades, setTempUpgrades] = useState({
    parry_size: 0,
    parry_duration: 0,
    double_sparks: 0,
    health_regen: 0,
    parry_cooldown: 0,
    spark_magnet: 0,
    extra_health: 0
  })
  
  // Upgrade selection
  const [upgradeOptions, setUpgradeOptions] = useState([])

  // Save permanent upgrades to localStorage
  useEffect(() => {
    localStorage.setItem('permanentUpgrades', JSON.stringify(permanentUpgrades))
  }, [permanentUpgrades])

  // Save total light sparks to localStorage
  useEffect(() => {
    localStorage.setItem('totalLightSparks', totalLightSparks.toString())
  }, [totalLightSparks])

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
      if (prev.parryCooldown <= 0) {
        // Calculate modified cooldown with upgrades
        const baseParryDuration = PARRY_DURATION * (1 + permanentUpgrades.shieldDuration * 0.3)
        const modifiedParryDuration = baseParryDuration * (1 + tempUpgrades.parry_duration * 0.1)
        const modifiedParryCooldown = PARRY_COOLDOWN * (1 - tempUpgrades.parry_cooldown * 0.15)
        console.log('Parry activated. Cooldown:', modifiedParryCooldown, 'Duration:', modifiedParryDuration);
        
        return {
          ...prev,
          parryActive: true,
          parryCooldown: modifiedParryCooldown,
          parryDuration: modifiedParryDuration,
          parryStartTime: performance.now()
        }
      }
      return prev
    })
  }, [gameState, permanentUpgrades.shieldDuration, tempUpgrades.parry_duration, tempUpgrades.parry_cooldown])

  // Start new game
  const startGame = () => {
    setGameState(GAME_STATES.PLAYING)
    setScore(0)
    setWave(1)
    setLightSparks(0)
    setEnemiesKilled(0)
    setWaveComplete(false)
    setWaveStartTime(performance.now())
    
    const baseHealth = 3 + Math.floor(permanentUpgrades.startHealth * 0.75)
    const extraHealth = tempUpgrades.extra_health || 0
    const totalHealth = baseHealth + extraHealth
    
    setPlayer({
      x: CANVAS_WIDTH / 2,
      y: CANVAS_HEIGHT / 2,
      health: totalHealth,
      maxHealth: totalHealth,
      speed: PLAYER_SPEED,
      parryActive: false,
      parryCooldown: 0,
      parryRadius: PARRY_RADIUS,
      parryDuration: PARRY_DURATION * (1 + permanentUpgrades.shieldDuration * 0.3),
      parryStartTime: 0
    })
    
    // Initialize first wave
    const firstWaveEnemies = spawnWaveEnemies(1, CANVAS_WIDTH, CANVAS_HEIGHT)
    setWaveEnemies(firstWaveEnemies)
    setEnemies([])
    setProjectiles([])
    setSparks([])
    setParticles([])
    setTempUpgrades({
      parry_size: 0,
      parry_duration: 0,
      double_sparks: 0,
      health_regen: 0,
      parry_cooldown: 0,
      spark_magnet: 0,
      extra_health: 0
    })
  }

  // Game over
  const gameOver = () => {
    setGameState(GAME_STATES.GAME_OVER)
    setTotalLightSparks(prev => prev + lightSparks)
  }

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
    setWaveComplete(false)
    setWaveStartTime(performance.now())
    
    const nextWaveEnemies = spawnWaveEnemies(nextWave, CANVAS_WIDTH, CANVAS_HEIGHT)
    setWaveEnemies(nextWaveEnemies)
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

  // Render function
  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
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
        ctx.fillStyle = '#ff0066'
        ctx.shadowColor = '#ff0066'
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(enemy.x, enemy.y, enemy.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })
      
      projectiles.forEach(projectile => {
        ctx.fillStyle = projectile.fromPlayer ? '#00ff00' : '#ff3333'
        ctx.shadowColor = projectile.fromPlayer ? '#00ff00' : '#ff3333'
        ctx.shadowBlur = 6
        ctx.beginPath()
        ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2)
        ctx.fill()
        ctx.shadowBlur = 0
      })
      
      ctx.fillStyle = '#ffff00'
      ctx.shadowColor = '#ffff00'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(player.x, player.y, PLAYER_SIZE, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0
      
      const healthBarWidth = 40
      const healthBarHeight = 6
      const healthBarX = player.x - healthBarWidth / 2
      const healthBarY = player.y - PLAYER_SIZE - 15
      
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
      
      if (player.parryActive) {
        const radius = player.parryRadius * (1 + tempUpgrades.parry_size * 0.05)
        ctx.strokeStyle = '#00ffff'
        ctx.shadowColor = '#00ffff'
        ctx.shadowBlur = 20
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(player.x, player.y, radius, 0, Math.PI * 2)
        ctx.stroke()
        ctx.shadowBlur = 0
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
  }, [gameState, player, enemies, projectiles, sparks, particles, tempUpgrades])

  // Game loop
  const gameLoop = useCallback((currentTime) => {
    const deltaTime = (currentTime - lastTimeRef.current) / 1000
    lastTimeRef.current = currentTime
    
    if (gameState === GAME_STATES.PLAYING) {
      setPlayer(prev => {
        let { parryActive, parryCooldown, parryDuration, parryStartTime } = prev;

        if (parryActive) {
          const parryElapsed = currentTime - parryStartTime;
          console.log(`Parry active. Elapsed: ${parryElapsed.toFixed(2)}, Duration: ${parryDuration.toFixed(2)}`);
          if (parryElapsed >= parryDuration) {
            parryActive = false;
            console.log('Parry deactivated.');
          }
        }

        const newPlayer = {
          ...prev,
          x: mousePos.x,
          y: mousePos.y,
          parryCooldown: Math.max(0, parryCooldown - deltaTime * 1000),
          parryActive,
        };
        
        if (permanentUpgrades.healthRegen > 0 && newPlayer.health < newPlayer.maxHealth) {
          const regenInterval = 3000 / permanentUpgrades.healthRegen
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
            const projectile = createEnemyProjectile(updated, player)
            if (projectile) {
              newProjectiles.push(projectile)
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
        
        setTimeout(() => {
          setGameState(GAME_STATES.UPGRADE_SELECTION)
        }, 1500)
      }
      
      setProjectiles(prev => {
        return prev.map(projectile => ({
          ...projectile,
          x: projectile.x + projectile.vx * deltaTime,
          y: projectile.y + projectile.vy * deltaTime
        })).filter(projectile => 
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
                if (distance(projectile, enemy) < enemy.size + 4) {
                  projectileDestroyed = true
                  
                  for (let i = 0; i < 6; i++) {
                    newParticles.push(createParticle(
                      enemy.x, 
                      enemy.y, 
                      enemy.color || '#ff0066'
                    ))
                  }
                  
                  const damagedEnemy = damageEnemy(enemy, projectile.damage)
                  
                  if (!damagedEnemy.alive) {
                    setEnemiesKilled(prev => prev + 1)
                    setScore(prev => prev + 25)
                    
                    const baseSparkCount = 2
                    const sparkMultiplier = 1 + (permanentUpgrades.sparkYield * 1.5)
                    const totalSparks = Math.floor(baseSparkCount * sparkMultiplier)
                    
                    for (let i = 0; i < totalSparks; i++) {
                      newSparks.push(createLightSpark(enemy.x, enemy.y))
                    }
                  }
                  
                  return damagedEnemy
                }
                return enemy
              })
            })
          }
          
          if (!projectile.fromPlayer && !player.parryActive) {
            if (distance(projectile, player) < PLAYER_SIZE + 4) {
              playerHit = true
              projectileDestroyed = true
              
              for (let i = 0; i < 8; i++) {
                newParticles.push(createParticle(
                  player.x, 
                  player.y, 
                  '#ff3333'
                ))
              }
            }
          }
          
          if (!projectileDestroyed) {
            newProjectiles.push(projectile)
          }
        })
        
        if (playerHit) {
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
        
        const baseCollectionRange = 20
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
        }
        
        return newSparks
      })
    }
    
    render()
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
          onShowUpgrades={() => setGameState(GAME_STATES.PERMANENT_UPGRADES)}
          totalLightSparks={totalLightSparks} 
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
