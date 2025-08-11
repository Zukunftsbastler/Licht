import React, { useState } from 'react';
import { Button } from '@/components/ui/button.jsx';

const MainMenu = ({ onStartGame, onStartNewGame, onShowUpgrades, totalLightSparks, permanentUpgrades }) => {
  const hasSaveGame = Object.values(permanentUpgrades).some(level => level > 0);
  const [confirmReset, setConfirmReset] = useState(false);

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
      <div className="space-y-6">
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button 
            onClick={onShowUpgrades}
            className="bg-cyan-600 hover:bg-cyan-700 text-black font-bold px-8 py-3 text-xl"
          >
            Shop / Upgrades ({totalLightSparks} Licht-Funken)
          </Button>
          <Button 
            onClick={onStartGame}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-xl"
          >
            Neuer Run
          </Button>
        </div>

        <div className="mt-8 max-w-md mx-auto p-4 rounded border border-red-800/40 bg-black/30">
          <h3 className="text-red-400 text-sm uppercase tracking-wider mb-2">Gefährlicher Bereich</h3>
          <p className="text-xs text-red-200/70 mb-3">
            Hard Reset setzt permanente Upgrades und Meta‑Fortschritt zurück.
          </p>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setConfirmReset(v => !v)}
              className="text-red-300 border border-red-600 hover:bg-red-900/30 px-4 py-2 text-sm rounded bg-transparent"
            >
              Neues Spiel (Hard Reset)
            </Button>
            {confirmReset && (
              <Button
                onClick={onStartNewGame}
                className="bg-red-700 hover:bg-red-800 text-white font-bold px-4 py-2 text-sm rounded"
              >
                Ja, alles zurücksetzen
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainMenu;
