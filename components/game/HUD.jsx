import React from 'react';

const HUD = ({ player, wave, score, lightSparks, permanentUpgrades, tempUpgrades }) => {
  return (
    <>
      {/* HUD */}
      <div className="absolute top-4 left-4 text-cyan-400 font-mono text-sm z-10">
        <div>Leben: {player.health}/{player.maxHealth}</div>
        <div>Welle: {wave}</div>
        <div>Punkte: {score}</div>
        <div>Licht-Funken: {lightSparks}</div>
        <div>Parry-Cooldown: {Math.max(0, Math.ceil(player.parryCooldown / 1000))}s</div>
        
        {/* Permanente Upgrade-Effekte */}
        {(permanentUpgrades.shieldDuration > 0 || permanentUpgrades.sparkYield > 0 || 
          permanentUpgrades.startHealth > 0 || permanentUpgrades.healthRegen > 0) && (
          <div className="mt-2 border-t border-cyan-400 pt-2">
            <div className="text-yellow-400">Permanente Boni:</div>
            {permanentUpgrades.shieldDuration > 0 && (
              <div>Parry-Dauer: +{(permanentUpgrades.shieldDuration * 30).toFixed(0)}%</div>
            )}
            {permanentUpgrades.sparkYield > 0 && (
              <div>Funken-Multiplikator: x{(1 + permanentUpgrades.sparkYield * 1.5).toFixed(1)}</div>
            )}
            {permanentUpgrades.startHealth > 0 && (
              <div>Bonus-Leben: +{Math.floor(permanentUpgrades.startHealth * 0.75)}</div>
            )}
            {permanentUpgrades.healthRegen > 0 && (
              <div>Regeneration: 1 Leben alle {(3 / permanentUpgrades.healthRegen).toFixed(1)}s</div>
            )}
          </div>
        )}
      </div>
      
      {/* Current upgrades */}
      <div className="absolute top-4 right-4 text-cyan-400 font-mono text-sm z-10">
        <div>Aktive Boni:</div>
        {tempUpgrades.parry_size > 0 && <div>+{tempUpgrades.parry_size * 5}% Parry-Größe</div>}
        {tempUpgrades.parry_duration > 0 && <div>+{tempUpgrades.parry_duration * 10}% Parry-Dauer</div>}
        {tempUpgrades.double_sparks > 0 && <div>+{tempUpgrades.double_sparks * 10}% Doppel-Funken</div>}
        {tempUpgrades.health_regen > 0 && <div>Heilung: {tempUpgrades.health_regen}</div>}
        {tempUpgrades.parry_cooldown > 0 && <div>-{tempUpgrades.parry_cooldown * 15}% Parry-Cooldown</div>}
        {tempUpgrades.spark_magnet > 0 && <div>Licht-Magnet: {tempUpgrades.spark_magnet}</div>}
        {tempUpgrades.extra_health > 0 && <div>+{tempUpgrades.extra_health} Extra-Leben</div>}
      </div>
    </>
  );
};

export default HUD;
