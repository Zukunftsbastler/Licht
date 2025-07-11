// Temporary upgrade system for between waves

// Temporary upgrade types
export const TEMP_UPGRADE_TYPES = {
  PARRY_SIZE: 'parry_size', 
  PARRY_DURATION: 'parry_duration',
  DOUBLE_SPARKS: 'double_sparks',
  HEALTH_REGEN: 'health_regen',
  PARRY_COOLDOWN: 'parry_cooldown',
  SPARK_MAGNET: 'spark_magnet',
  EXTRA_HEALTH: 'extra_health'
}

// Upgrade definitions
const UPGRADE_DEFINITIONS = {
  [TEMP_UPGRADE_TYPES.PARRY_SIZE]: {
    name: 'Größerer Lichtschild',
    description: '+5% Parry-Schildgröße',
    icon: '🛡️',
    effect: (current) => current + 1,
    maxStacks: 8
  },
  [TEMP_UPGRADE_TYPES.PARRY_DURATION]: {
    name: 'Längerer Lichtimpuls',
    description: '+10% Parry-Schilddauer',
    icon: '⏱️',
    effect: (current) => current + 1,
    maxStacks: 6
  },
  [TEMP_UPGRADE_TYPES.DOUBLE_SPARKS]: {
    name: 'Funkenverdoppler',
    description: '+10% Chance auf doppelte Licht-Funken',
    icon: '✨',
    effect: (current) => current + 1,
    maxStacks: 10
  },
  [TEMP_UPGRADE_TYPES.HEALTH_REGEN]: {
    name: 'Heilendes Licht',
    description: 'Regeneriert 1 Leben alle 10 Sekunden',
    icon: '❤️',
    effect: (current) => current + 1,
    maxStacks: 3
  },
  [TEMP_UPGRADE_TYPES.PARRY_COOLDOWN]: {
    name: 'Schnellere Reflexe',
    description: '-15% Parry-Cooldown',
    icon: '⚡',
    effect: (current) => current + 1,
    maxStacks: 4
  },
  [TEMP_UPGRADE_TYPES.SPARK_MAGNET]: {
    name: 'Licht-Magnet',
    description: 'Sammelt Licht-Funken aus größerer Entfernung',
    icon: '🧲',
    effect: (current) => current + 1,
    maxStacks: 3
  },
  [TEMP_UPGRADE_TYPES.EXTRA_HEALTH]: {
    name: 'Verstärkter Panzer',
    description: '+1 zusätzliches Leben',
    icon: '💚',
    effect: (current) => current + 1,
    maxStacks: 2
  }
}

// Generate random upgrade options
export function generateUpgradeOptions(currentUpgrades, wave) {
  const availableUpgrades = Object.keys(UPGRADE_DEFINITIONS).filter(type => {
    const def = UPGRADE_DEFINITIONS[type]
    const currentLevel = currentUpgrades[type] || 0
    return currentLevel < def.maxStacks
  })

  // Ensure we have at least 3 options, or all available if less
  const numOptions = Math.min(3, availableUpgrades.length)
  const selectedUpgrades = []

  // Randomly select upgrades
  for (let i = 0; i < numOptions; i++) {
    const randomIndex = Math.floor(Math.random() * availableUpgrades.length)
    const selectedType = availableUpgrades.splice(randomIndex, 1)[0]
    selectedUpgrades.push(selectedType)
  }

  return selectedUpgrades.map(type => ({
    type,
    ...UPGRADE_DEFINITIONS[type],
    currentLevel: currentUpgrades[type] || 0
  }))
}

// Apply upgrade to current upgrades
export function applyUpgrade(currentUpgrades, upgradeType) {
  const def = UPGRADE_DEFINITIONS[upgradeType]
  if (!def) return currentUpgrades

  const currentLevel = currentUpgrades[upgradeType] || 0
  if (currentLevel >= def.maxStacks) return currentUpgrades

  return {
    ...currentUpgrades,
    [upgradeType]: def.effect(currentLevel)
  }
}

// Get upgrade display info
export function getUpgradeDisplayInfo(upgradeType, currentLevel) {
  const def = UPGRADE_DEFINITIONS[upgradeType]
  if (!def) return null

  return {
    name: def.name,
    description: def.description,
    icon: def.icon,
    currentLevel,
    maxLevel: def.maxStacks,
    isMaxed: currentLevel >= def.maxStacks
  }
}

// Calculate upgrade effects on player stats
export function calculateUpgradeEffects(upgrades) {
  return {
    parrySizeMultiplier: 1 + (upgrades[TEMP_UPGRADE_TYPES.PARRY_SIZE] || 0) * 0.05,
    parryDurationMultiplier: 1 + (upgrades[TEMP_UPGRADE_TYPES.PARRY_DURATION] || 0) * 0.1,
    doubleSparkChance: (upgrades[TEMP_UPGRADE_TYPES.DOUBLE_SPARKS] || 0) * 0.1,
    healthRegenRate: upgrades[TEMP_UPGRADE_TYPES.HEALTH_REGEN] || 0,
    parryCooldownMultiplier: 1 - (upgrades[TEMP_UPGRADE_TYPES.PARRY_COOLDOWN] || 0) * 0.15,
    sparkMagnetRange: 1 + (upgrades[TEMP_UPGRADE_TYPES.SPARK_MAGNET] || 0) * 0.5,
    extraHealth: upgrades[TEMP_UPGRADE_TYPES.EXTRA_HEALTH] || 0
  }
}

