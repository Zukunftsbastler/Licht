import React from 'react';
import { Button } from '@/components/ui/button.jsx';
import SkillTreeGraph from './SkillTreeGraph.jsx';

const PermanentUpgradesScreen = ({ onBackToMenu, onBuyUpgrade, totalLightSparks, permanentUpgrades, metaProgress, metaStats, onBuyMetaNode }) => {
  // Alter Legacy-Shop entfernt; Skill-Tree ersetzt diesen vollständig.

  return (
    <div className="text-center w-full max-w-4xl mx-auto px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 md:mb-8 text-cyan-400">
        Permanente Upgrades
      </h1>
      <div className="text-lg md:text-xl mb-4 text-yellow-400">
        Verfügbare Licht-Funken: {totalLightSparks}
      </div>

      <div className="max-h-[70vh] overflow-auto overscroll-contain pr-1">
        <SkillTreeGraph
          totalLightSparks={totalLightSparks}
          metaProgress={metaProgress}
          metaStats={metaStats}
          onBuyMetaNode={onBuyMetaNode}
        />
        <div className="sticky bottom-0 bg-black/80 border-t border-gray-700 mt-4 pt-3 pb-4">
          <Button 
            onClick={onBackToMenu}
            className="bg-gray-600 hover:bg-gray-700 text-white font-bold px-6 md:px-8 py-3 text-lg md:text-xl touch-manipulation"
          >
            Zurück zum Hauptmenü
          </Button>
        </div>
      </div>
      
    </div>
  );
};

export default PermanentUpgradesScreen;
