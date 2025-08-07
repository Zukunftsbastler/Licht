# Licht-Käfer Roguelite

This document provides a comprehensive overview of the Licht-Käfer Roguelite game, its architecture, components, and game logic. It is intended to help developers quickly understand the project and its underlying principles.

## Game Concept

Licht-Käfer is a 2D roguelite game where the player controls a light beetle. The objective is to survive waves of enemies by parrying their projectiles. Successfully parrying projectiles reflects them back at the enemies, dealing damage. Defeating enemies rewards the player with light sparks, which can be used to purchase permanent upgrades between runs. After each wave, the player can choose from a selection of temporary upgrades that last for the current run.

The game is designed to be extensible, allowing for the addition of new enemy types, upgrades, and other features.

## Architecture

The application is built with React and Vite. It uses a component-based architecture, with a main `App` component that manages the game state and renders the appropriate UI components based on the current game state.

The game logic is separated into several modules:

-   **`enemySystem.js`**: Handles the generative creation of enemies, their movement, and attacks. See `enemyParameters.md` for a detailed breakdown of the generative system.
-   **`gameUtils.js`**: Provides utility functions for game mechanics like distance calculation, collision detection, and particle effects.
-   **`upgradeSystem.js`**: Manages the logic for both temporary and permanent upgrades.
-   **`enemyParameters.md`**: This document outlines the parameters for the generative enemy system.

## Components

The UI is broken down into the following components, located in the `src/components/game` directory:

-   **`App.jsx`**: The main component that holds the game state and main game loop.
-   **`Game.jsx`**: Renders the game canvas and the HUD.
-   **`MainMenu.jsx`**: The main menu of the game.
-   **`UpgradeScreen.jsx`**: The screen for selecting temporary upgrades between waves.
-   **`GameOverScreen.jsx`**: The screen that appears when the player loses.
-   **`PermanentUpgradesScreen.jsx`**: The screen for purchasing permanent upgrades.
-   **`HUD.jsx`**: The Heads-Up Display, showing player health, score, wave number, etc.

## State Management

The main game state is managed in the `App` component using React's `useState` and `useReducer` hooks. The state is passed down to child components as props.

### Key State Variables

-   **`gameState`**: The current state of the game (e.g., `MENU`, `PLAYING`, `GAME_OVER`).
-   **`player`**: An object containing the player's state, such as position, health, and parry status.
-   **`enemies`**: An array of enemy objects currently on the screen.
-   **`projectiles`**: An array of projectile objects.
-   **`lightSparks`**: The number of light sparks collected in the current run.
-   **`totalLightSparks`**: The total number of light sparks collected across all runs (persisted in `localStorage`).
-   **`permanentUpgrades`**: An object containing the player's permanent upgrades (persisted in `localStorage`).
-   **`tempUpgrades`**: An object containing the temporary upgrades for the current run.

## Game Logic

### Game Loop

The game loop is implemented in the `App` component using `requestAnimationFrame`. It is responsible for updating the game state and re-rendering the canvas on each frame.

### Parry Mechanic

The parry mechanic is a core element of the game. When the player clicks the mouse, a parry is initiated. If a projectile collides with the parry shield, it is reflected back at the enemies.

-   **`PARRY_DURATION`**: The duration of the parry shield in milliseconds.
-   **`PARRY_COOLDOWN`**: The cooldown period after a parry in milliseconds.

## Development Guidelines

When extending the game, please adhere to the following principles:

-   **Component-Based Architecture**: Create new components for new UI elements and keep them small and focused on a single responsibility.
-   **State Management**: For new game state, consider whether it should be managed in the `App` component or in a more localized component.
-   **Modularity**: Keep the game logic modular by creating new systems (similar to `enemySystem.js` and `upgradeSystem.js`) for new features.
-   **Extensibility**: Design new features with extensibility in mind. For example, when adding new enemy types, consider how they can be easily integrated into the existing enemy spawning system.
