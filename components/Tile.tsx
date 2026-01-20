import React from 'react';
import { TILE_COLORS } from '../constants';

interface TileProps {
  value: number;
}

const Tile: React.FC<TileProps> = ({ value }) => {
  const styles = TILE_COLORS[value] || TILE_COLORS[2048]; // Fallback to 2048 style if higher
  const isLargeNumber = value > 100 && value < 1000;
  const isSuperLargeNumber = value >= 1000;

  return (
    <div 
      className="w-full h-full rounded-lg flex items-center justify-center font-bold select-none transition-all duration-200 transform hover:scale-[1.02]"
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        boxShadow: styles.shadow,
        animation: 'popIn 0.3s ease-out backwards'
      }}
    >
      <span className={`${isSuperLargeNumber ? 'text-2xl' : isLargeNumber ? 'text-3xl' : 'text-4xl'}`}>
        {value}
      </span>
      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(Tile);