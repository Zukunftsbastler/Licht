import React from 'react';
import { playSfx, unlockAudio } from '@/audio/audio.js';

export const Button = ({ onClick, children, className, disabled }) => {
  const handleClick = (e) => {
    try {
      unlockAudio();
      playSfx('ui/button_click', { volume: 0.6 });
    } catch {}
    if (onClick) onClick(e);
  };

  const handleMouseEnter = () => {
    try { playSfx('ui/button_hover', { volume: 0.35 }); } catch {}
  };

  return (
    <button
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      className={`px-4 py-2 rounded ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
