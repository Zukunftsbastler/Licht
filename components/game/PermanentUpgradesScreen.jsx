import React from 'react';
import { Button } from '@/components/ui/button.jsx';

const PermanentUpgradesScreen = ({ onBackToMenu, onBuyUpgrade, totalLightSparks, permanentUpgrades }) => {
  const upgradeCosts = {
    shieldDuration: (permanentUpgrades.shieldDuration + 1) * 10,
    sparkYield: (permanentUpgrades.sparkYield + 1) * 15,
    startHealth: (permanentUpgrades.startHealth + 1) * 20,
    healthRegen: (permanentUpgrades.healthRegen + 1) * 25
  };

  return (
    <div className="text-center w-full max-w-4xl mx-auto px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-8 text-cyan-400">
        Permanente Upgrades
      </h1>
      <div className="text-lg md:text-xl mb-4 text-yellow-400">
        Verfügbare Licht-Funken: {totalLightSparks}
      </div>
      
      <div className="max-h-[60vh] md:max-h-none overflow-y-auto overscroll-contain">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8 px-2">
          {/* Shield Duration */}
          <div className="bg-gray-900 p-4 rounded border border-cyan-400 touch-manipulation">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Schild-Dauer</h3>
            <p className="text-sm text-gray-300 mb-2">
              Erhöht die Parry-Dauer um 30% pro Stufe
            </p>
            <p className="text-yellow-400">Stufe: {permanentUpgrades.shieldDuration}</p>
            <p className="text-cyan-400 mb-3">Kosten: {upgradeCosts.shieldDuration}</p>
            <Button 
              onClick={() => onBuyUpgrade('shieldDuration')}
              disabled={totalLightSparks < upgradeCosts.shieldDuration}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white w-full touch-manipulation"
            >
              Kaufen
            </Button>
          </div>
          
          {/* Spark Yield */}
          <div className="bg-gray-900 p-4 rounded border border-cyan-400 touch-manipulation">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Funken-Ausbeute</h3>
            <p className="text-sm text-gray-300 mb-2">
              Erhöht Licht-Funken um 150% pro Stufe
            </p>
            <p className="text-yellow-400">Stufe: {permanentUpgrades.sparkYield}</p>
            <p className="text-cyan-400 mb-3">Kosten: {upgradeCosts.sparkYield}</p>
            <Button 
              onClick={() => onBuyUpgrade('sparkYield')}
              disabled={totalLightSparks < upgradeCosts.sparkYield}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white w-full touch-manipulation"
            >
              Kaufen
            </Button>
          </div>
          
          {/* Start Health */}
          <div className="bg-gray-900 p-4 rounded border border-cyan-400 touch-manipulation">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Start-Leben</h3>
            <p className="text-sm text-gray-300 mb-2">
              Fügt 75% Lebensenergie hinzu pro Stufe
            </p>
            <p className="text-yellow-400">Stufe: {permanentUpgrades.startHealth}</p>
            <p className="text-cyan-400 mb-3">Kosten: {upgradeCosts.startHealth}</p>
            <Button 
              onClick={() => onBuyUpgrade('startHealth')}
              disabled={totalLightSparks < upgradeCosts.startHealth}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white w-full touch-manipulation"
            >
              Kaufen
            </Button>
          </div>
          
          {/* Health Regen */}
          <div className="bg-gray-900 p-4 rounded border border-cyan-400 touch-manipulation">
            <h3 className="text-lg font-bold text-cyan-400 mb-2">Lebens-Regeneration</h3>
            <p className="text-sm text-gray-300 mb-2">
              Regeneriert 1 Leben alle 3 Sekunden pro Stufe
            </p>
            <p className="text-yellow-400">Stufe: {permanentUpgrades.healthRegen}</p>
            <p className="text-cyan-400 mb-3">Kosten: {upgradeCosts.healthRegen}</p>
            <Button 
              onClick={() => onBuyUpgrade('healthRegen')}
              disabled={totalLightSparks < upgradeCosts.healthRegen}
              className="bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white w-full touch-manipulation"
            >
              Kaufen
            </Button>
          </div>
        </div>
      </div>
      
      <Button 
        onClick={onBackToMenu}
        className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 md:px-8 py-3 text-lg md:text-xl touch-manipulation"
      >
        Zurück zum Hauptmenü
      </Button>
    </div>
  );
};

export default PermanentUpgradesScreen;
