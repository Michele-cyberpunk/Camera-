import React from 'react';
import { type ExtractedColor } from '../types';
import { CheckIcon } from './icons';

interface ColorSwatchProps {
  color: ExtractedColor;
  isSelected: boolean;
  onClick: () => void;
}

const ColorSwatch: React.FC<ColorSwatchProps> = ({ color, isSelected, onClick }) => {
  const textColor = isLightColor(color.hex) ? 'text-black' : 'text-white';

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-square rounded-lg cursor-pointer transition-all duration-200 flex flex-col justify-end p-2 text-left shadow-md transform hover:scale-105 ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-gray-800 scale-105' : 'ring-1 ring-white/10'}`}
      style={{ backgroundColor: color.hex }}
    >
      {isSelected && (
        <div className="absolute top-1 right-1 bg-cyan-500 rounded-full p-0.5">
          <CheckIcon className="w-3 h-3 text-white" />
        </div>
      )}
      <div className={`font-bold text-xs truncate ${textColor} [text-shadow:_0_1px_3px_rgb(0_0_0_/_0.7)]`}>{color.name}</div>
      <div className={`text-xs opacity-80 truncate ${textColor} [text-shadow:_0_1px_3px_rgb(0_0_0_/_0.7)]`}>{color.semantic}</div>
    </div>
  );
};

// Helper function to determine if a color is light or dark for text contrast
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Using the luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6;
}

export default ColorSwatch;
