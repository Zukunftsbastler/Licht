import React from 'react';

const UpgradeScreen = ({ wave, onSelectUpgrade, upgradeOptions }) => {
  return (
    <div className="text-center w-full max-w-4xl mx-auto px-4">
      <h1 className="text-3xl md:text-4xl font-bold mb-4 text-cyan-400">
        Welle {wave} abgeschlossen!
      </h1>
      <p className="text-lg md:text-xl mb-6 md:mb-8 text-yellow-400">
        Wähle ein Upgrade für die nächste Welle:
      </p>
      
      <div className="max-h-[60vh] md:max-h-none overflow-y-auto overscroll-contain">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 px-2">
          {upgradeOptions.map((option) => (
            <div 
              key={option.type}
              className="bg-gray-900 p-4 md:p-6 rounded border border-cyan-400 hover:border-yellow-400 cursor-pointer transition-colors touch-manipulation"
              onClick={() => onSelectUpgrade(option.type)}
            >
              <div className="text-3xl md:text-4xl mb-3 md:mb-4">{option.icon}</div>
              <h3 className="text-xl font-bold text-cyan-400 mb-2">
                {option.name}
              </h3>
              <p className="text-gray-300 mb-4">
                {option.description}
              </p>
              <div className="text-sm text-yellow-400">
                Stufe: {option.currentLevel} / {option.maxLevel}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UpgradeScreen;
