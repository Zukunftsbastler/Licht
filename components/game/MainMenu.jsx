import React from 'react';
import { Button } from '@/components/ui/button.jsx';

const MainMenu = ({ onStartGame, onShowUpgrades, totalLightSparks }) => {
  return (
    <div className="text-center">
      <h1 className="text-6xl font-bold mb-4 text-yellow-400 glow">
        Licht-Käfer
      </h1>
      <h2 className="text-2xl mb-8 text-cyan-400">
        Roguelite
      </h2>
      <p className="text-lg mb-8 max-w-2xl text-gray-300">
        Du bist ein Licht-Käfer in einem von Fäulnis befallenen Moos-Hain. 
        Pariere die Schatten-Stacheln der aggressiven Schatten-Motten mit deinem Licht-Impuls 
        und sammle Licht-Funken für permanente Upgrades.
      </p>
      <div className="space-y-4">
        <Button 
          onClick={onStartGame}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-3 text-xl"
        >
          Spiel starten
        </Button>
        <Button 
          onClick={onShowUpgrades}
          className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold px-8 py-3 text-xl"
        >
          Upgrades ({totalLightSparks} Licht-Funken)
        </Button>
      </div>
    </div>
  );
};

export default MainMenu;
