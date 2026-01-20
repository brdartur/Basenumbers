import React from 'react';
import { Grid } from '../types';
import Tile from './Tile';
import GridCell from './GridCell';
import { COLORS } from '../constants';

interface BoardProps {
  grid: Grid;
}

const Board: React.FC<BoardProps> = ({ grid }) => {
  return (
    <div 
      className="relative rounded-xl aspect-square w-full max-w-[400px] p-3"
      style={{ backgroundColor: COLORS.gridBackground }}
    >
      {/* 
         Unified Grid Approach:
         Instead of two separate absolute layers, we iterate once.
         Each cell serves as a relative container for both the background (GridCell)
         and the Tile (absolute on top of the cell).
         This guarantees perfect alignment.
      */}
      <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full">
        {grid.map((row, rowIndex) => (
          row.map((value, colIndex) => (
            <div key={`${rowIndex}-${colIndex}`} className="relative w-full h-full">
              {/* Background Layer of the Cell */}
              <div className="absolute inset-0">
                 <GridCell />
              </div>

              {/* Tile Layer (if value > 0) */}
              {value !== 0 && (
                <div className="absolute inset-0 z-10">
                  <Tile value={value} />
                </div>
              )}
            </div>
          ))
        ))}
      </div>
    </div>
  );
};

export default Board;