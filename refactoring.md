# Refactoring Plan for Licht-Käfer

This document outlines the plan for refactoring the `App.jsx` file into smaller, more manageable components.

## 1. Create a `components` directory

All new components will be placed in a `components/game` directory to keep them organized and separate from the UI components.

## 2. Break down `App.jsx` into smaller components

The `App.jsx` file will be broken down into the following components:

-   **`Game.jsx`**: This component will contain the main game logic, including the canvas, game loop, and rendering of game objects. It will receive the game state and functions to update it as props.
-   **`MainMenu.jsx`**: This component will render the main menu, with buttons to start the game and view permanent upgrades.
-   **`UpgradeScreen.jsx`**: This component will display the upgrade options between waves.
-   **`GameOverScreen.jsx`**: This component will be displayed when the game is over, showing the final score and providing options to restart or go to the main menu.
-   **`PermanentUpgradesScreen.jsx`**: This component will allow the player to buy permanent upgrades with the light sparks they have collected.
-   **`HUD.jsx`**: This component will display the Heads-Up Display, including health, score, wave number, etc.

## 3. Refactor `App.jsx` to use the new components

The `App.jsx` file will be refactored to be the main container component that manages the game state and renders the appropriate component based on the current `gameState`.

## 4. Step-by-step implementation

The refactoring will be done step-by-step:

1.  [x] Create the `refactoring.md` file.
2.  [x] Create the `components/game` directory.
3.  [x] Create the `MainMenu.jsx` component.
4.  [x] Create the `PermanentUpgradesScreen.jsx` component.
5.  [x] Create the `UpgradeScreen.jsx` component.
6.  [x] Create the `GameOverScreen.jsx` component.
7.  [x] Create the `HUD.jsx` component.
8.  [x] Create the `Game.jsx` component.
9.  [x] Refactor `App.jsx` to use the new components.
