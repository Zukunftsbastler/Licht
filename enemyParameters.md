# Generative Enemy System Parameters

This document outlines the parameters for a generative enemy system in the Licht-Käfer Roguelite game. The goal is to create a flexible system that can generate a wide variety of enemies by combining different properties and behaviors. Each parameter has a `score` that contributes to the overall difficulty of an enemy.

## Enemy Parameters

An enemy is defined by a collection of parameters that describe its appearance, movement, attack patterns, and special abilities.

### `body`

Defines the physical properties of the enemy.

-   **`radius`** (Number): The size of the enemy's hitbox. `score: radius * 0.5`
-   **`health`** (Number): The amount of damage the enemy can sustain. `score: health * 10`
-   **`color`** (String): The color of the enemy. `score: 0`
-   **`onTouch`** (String): The effect when the player touches the enemy.
    -   `damage`: `score: 20`
    -   `immobilize`: `score: 10`
    -   `none`: `score: 0`
-   **`isSolid`** (Boolean): If `true`, the player cannot pass through the enemy. `score: 5`

### `movement`

Defines how the enemy moves.

-   **`type`** (String): The movement pattern.
    -   `homing`: `score: 30`
    -   `teleport`: `score: 20`
    -   `straight`: `score: 10`
    -   `still`: `score: 0`
-   **`speed`** (Number): The speed of the enemy. `score: speed * 0.5`

### `appearance`

Defines the visual representation of the enemy.

-   **`shape`** (String): The shape of the enemy. `score: 0`
-   **`sprite`** (String): Path to a sprite image. `score: 0`
-   **`isVisible`** (Boolean): If `false`, the enemy is invisible. `score: 40`
-   **`fadeInOnAttack`** (Boolean): If `true`, an invisible enemy becomes visible before attacking. `score: -10` (reduces difficulty of invisibility)

### `attack`

Defines the enemy's attack behavior.

-   **`type`** (String): The type of attack.
    -   `beam`: `score: 50`
    -   `spread`: `score: 40`
    -   `burst`: `score: 30`
    -   `singleShot`: `score: 10`
-   **`projectile`** (Object): A reference to a projectile definition. `score: projectile.score`
-   **`fireRate`** (Number): Time between attacks in ms. `score: (1000 / fireRate) * 5`
-   **`burstCount`** (Number): Number of projectiles in a burst. `score: burstCount * 5`
-   **`spreadCount`** (Number): Number of projectiles in a spread attack. `score: spreadCount * 5`

### `onDeath`

Defines what happens when the enemy is defeated.

-   **`action`** (String): The action on death.
    -   `spawnEnemies`: `score: 30`
    -   `explode`: `score: 20`
    -   `none`: `score: 0`
-   **`explosionRadius`** (Number): `score: explosionRadius * 0.2`
-   **`explosionDamage`** (Number): `score: explosionDamage * 10`
-   **`spawnCount`** (Number): `score: spawnCount * 5`
-   **`spawnedEnemyType`** (Object): `score: spawnedEnemyType.score`

### `specialAbilities`

-   **`canSpawnEnemies`**: `score: 50`
-   **`canBecomeInvisible`**: `score: 40`

## Projectile Parameters

Each projectile also has a score.

-   **`type`** (String):
    -   `penetrating`: `score: 40`
    -   `homing`: `score: 30`
    -   `enlarging`: `score: 20`
    -   `normal`: `score: 10`
-   **`speed`** (Number): `score: speed * 0.2`
-   **`damage`** (Number): `score: damage * 10`
-   **`visualEffect`** (String):
    -   `blinking`: `score: 10`
    -   `none`: `score: 0`

---

### 2.  Difficulty Calculation Formula

Now, I'll create a new function in `gameUtils.js` to calculate the difficulty score of an enemy and a wave.

**`calculateEnemyScore(enemy)`:** This function will take an enemy object and calculate its total difficulty score by summing up the scores of all its parameters.

**`calculateWaveScore(enemies)`:** This function will take an array of enemies and calculate the total wave difficulty by summing up the scores of all enemies in the wave.

Here's how the formula would look in pseudocode:

```javascript
function calculateEnemyScore(enemy) {
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
  if (!enemy.appearance.isVisible) {
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

  // ... and so on for onDeath and specialAbilities

  return score;
}

function calculateWaveScore(enemies) {
  let totalScore = 0;
  for (const enemy of enemies) {
    totalScore += calculateEnemyScore(enemy);
  }
  return totalScore;
}
```

### 3.  Implementation in `gameUtils.js`

I will now add the `calculateEnemyScore` and `calculateWaveScore` functions to `gameUtils.js`. This will make them available to the rest of the application, so we can use them to generate waves with a controlled difficulty.

I'll start by reading `gameUtils.js`.
