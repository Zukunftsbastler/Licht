import React from 'react';

export const Button = ({ onClick, children, className, disabled }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded ${className}`}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
