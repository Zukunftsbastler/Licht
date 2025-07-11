import React from 'react';
import HUD from './HUD.jsx';

const Game = ({
  player,
  wave,
  score,
  lightSparks,
  permanentUpgrades,
  tempUpgrades,
  canvasRef,
  canvasWidth,
  canvasHeight,
}) => {
  return (
    <div className="relative">
      <HUD
        player={player}
        wave={wave}
        score={score}
        lightSparks={lightSparks}
        permanentUpgrades={permanentUpgrades}
        tempUpgrades={tempUpgrades}
      />
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="border border-cyan-400 cursor-none"
        style={{ background: '#000000' }}
      />
    </div>
  );
};

export default Game;
