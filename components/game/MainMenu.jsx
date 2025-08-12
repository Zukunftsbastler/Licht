import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button.jsx';

const MainMenu = ({ onStartGame, onStartNewGame, onShowUpgrades, totalLightSparks, permanentUpgrades, highestWaveReached }) => {
  const hasSaveGame = Object.values(permanentUpgrades).some(level => level > 0);
  const [confirmReset, setConfirmReset] = useState(false);
  const startWaveOptions = useMemo(() => {
    const options = [1];
    const maxMultiple = Math.floor((highestWaveReached || 0) / 5) * 5;
    for (let w = 5; w <= maxMultiple; w += 5) options.push(w);
    return options;
  }, [highestWaveReached]);
  const [selectedStartWave, setSelectedStartWave] = useState(1);
  useEffect(() => {
    setSelectedStartWave(startWaveOptions[startWaveOptions.length - 1] || 1);
  }, [startWaveOptions]);

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

          <div className="flex items-center gap-2 bg-black/30 border border-cyan-700 px-3 py-2 rounded">
            <label className="text-cyan-300 text-sm">Startwelle</label>
            <select
              value={selectedStartWave}
              onChange={(e) => setSelectedStartWave(parseInt(e.target.value, 10))}
              className="bg-black/40 border border-cyan-600 text-cyan-200 px-2 py-1 rounded"
            >
              {startWaveOptions.map(w => (
                <option key={w} value={w}>Welle {w}</option>
              ))}
            </select>
          </div>

          <Button 
            onClick={() => onStartGame(selectedStartWave)}
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
