import React from 'react';
import { COLORS } from '../constants';

const GridCell: React.FC = () => {
  return (
    <div 
      className="w-full h-full rounded-lg"
      style={{ backgroundColor: COLORS.gridEmptyCell }}
    />
  );
};

export default React.memo(GridCell);