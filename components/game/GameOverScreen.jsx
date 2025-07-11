import React from 'react';
import { Button } from '@/components/ui/button.jsx';

const GameOverScreen = ({ wave, score, lightSparks, onRestart, onShowUpgrades, onBackToMenu, totalLightSparks }) => {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4 text-red-400">
        Spiel beendet
      </h1>
      <div className="text-xl mb-8 text-cyan-400">
        <div>Erreichte Welle: {wave}</div>
        <div>Punkte: {score}</div>
        <div>Gesammelte Licht-Funken: {lightSparks}</div>
      </div>
      <div className="space-y-4">
        <Button 
          onClick={onRestart}
          className="bg-yellow-600 hover:bg-yellow-700 text-black font-bold px-8 py-3 text-xl"
        >
          Erneut spielen
        </Button>
        <Button 
          onClick={onShowUpgrades}
          className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold px-8 py-3 text-xl"
        >
          Upgrades ({totalLightSparks} Licht-Funken)
        </Button>
        <Button 
          onClick={onBackToMenu}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-8 py-3 text-xl"
        >
          Hauptmenü
        </Button>
      </div>
    </div>
  );
};

export default GameOverScreen;
