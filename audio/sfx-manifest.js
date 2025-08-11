/**
 * Static SFX manifest mapped to existing files in /audio/sfx.
 * Keys correspond to playSfx(key) usage. Values are arrays of candidate file paths.
 * This ensures we load your ElevenLabs files even if they contain descriptive suffixes.
 */
export const SFX_MANIFEST = {
  // UI
  "ui/button_hover": ["/audio/sfx/11L-ui:button_hover_Subtle_wood_chime_ti-1754867173310.mp3"],
  "ui/button_click": ["/audio/sfx/11L-uibutton_click_Small-1754867240596.mp3"],
  "ui/upgrade_open": ["/audio/sfx/11L-uiupgrade_open_Soft_-1754867339928.mp3"],

  // Waves / Events
  "wave/start": ["/audio/sfx/11L-wavestart_Brief_low_-1754867826083.mp3"],
  "wave/clear": ["/audio/sfx/11L-waveclear_Gentle_mul-1754867856508.mp3"],
  "boss/intro": ["/audio/sfx/11L-bossintro_Darker_org-1754867885340.mp3"],

  // Enemies
  "enemy/spawn": ["/audio/sfx/11L-enemyspawn_Subtle_ma-1754867634858.mp3"],
  "enemy/teleport": ["/audio/sfx/11L-enemyteleport_Phase_-1754867738345.mp3"],
  "enemy/dash": ["/audio/sfx/11L-enemydash_Quick_low_-1754867773683.mp3"],
  "enemy/missile_launch": ["/audio/sfx/11L-enemymissile_launch_-1754868217466.mp3"],
  "enemy/death_small": ["/audio/sfx/11L-enemydeath_small_Sof-1754867681594.mp3"],
  "enemy/death_medium": ["/audio/sfx/11L-enemydeath_medium_Sof-1754867662142.mp3"],

  // Player
  "player/parry_activate": ["/audio/sfx/11L-playerparry_activate-1754867406029.mp3"],
  "player/parry_reflect": ["/audio/sfx/11L-playerparry_reflect_-1754867454096.mp3"],
  "player/hit": ["/audio/sfx/11L-playerhit_Soft_but_a-1754867482790.mp3"],
  "player/death": ["/audio/sfx/11L-playerdeath_Falling_-1754867528346.mp3"],
  "player/spark_pickup": ["/audio/sfx/11L-playerspark_pickup_B-1754867581137.mp3"]
};
