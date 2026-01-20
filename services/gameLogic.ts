import { Grid, MoveResult, Direction, GameState } from '../types';
import { GRID_SIZE } from '../constants';

export const getEmptyGrid = (): Grid => {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
};

export const addRandomTile = (grid: Grid): Grid => {
  const emptyCells = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) {
        emptyCells.push({ r, c });
      }
    }
  }

  if (emptyCells.length === 0) return grid;

  const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const newGrid = grid.map(row => [...row]);
  newGrid[randomCell.r][randomCell.c] = Math.random() < 0.9 ? 2 : 4;
  return newGrid;
};

// Helper to rotate grid 90 degrees clockwise (used to standardize movement logic)
const rotateRight = (grid: Grid): Grid => {
  const newGrid = getEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[c][GRID_SIZE - 1 - r] = grid[r][c];
    }
  }
  return newGrid;
};

const rotateLeft = (grid: Grid): Grid => {
  const newGrid = getEmptyGrid();
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      newGrid[GRID_SIZE - 1 - c][r] = grid[r][c];
    }
  }
  return newGrid;
};

const slideLeft = (grid: Grid): { grid: Grid; score: number } => {
  let score = 0;
  const newGrid = grid.map(row => {
    // 1. Remove zeros
    let filtered = row.filter(val => val !== 0);
    
    // 2. Merge
    for (let i = 0; i < filtered.length - 1; i++) {
      if (filtered[i] === filtered[i + 1]) {
        filtered[i] *= 2;
        score += filtered[i];
        filtered.splice(i + 1, 1);
      }
    }
    
    // 3. Pad with zeros
    while (filtered.length < GRID_SIZE) {
      filtered.push(0);
    }
    return filtered;
  });
  return { grid: newGrid, score };
};

export const move = (grid: Grid, direction: Direction): MoveResult => {
  let tempGrid = grid.map(row => [...row]);
  let score = 0;

  // Standardize to "Left" movement via rotation
  if (direction === 'UP') tempGrid = rotateLeft(tempGrid);
  if (direction === 'RIGHT') tempGrid = rotateLeft(rotateLeft(tempGrid));
  if (direction === 'DOWN') tempGrid = rotateRight(tempGrid);

  const result = slideLeft(tempGrid);
  tempGrid = result.grid;
  score = result.score;

  // Rotate back
  if (direction === 'UP') tempGrid = rotateRight(tempGrid);
  if (direction === 'RIGHT') tempGrid = rotateRight(rotateRight(tempGrid));
  if (direction === 'DOWN') tempGrid = rotateLeft(tempGrid);

  // Check if grid actually changed
  const moved = JSON.stringify(grid) !== JSON.stringify(tempGrid);

  return { grid: tempGrid, score, moved };
};

export const checkGameOver = (grid: Grid): boolean => {
  // Check for empty cells
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) return false;
    }
  }

  // Check for possible merges
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (c < GRID_SIZE - 1 && grid[r][c] === grid[r][c + 1]) return false;
      if (r < GRID_SIZE - 1 && grid[r][c] === grid[r + 1][c]) return false;
    }
  }

  return true;
};

export const hasWon = (grid: Grid): boolean => {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] >= 2048) return true;
    }
  }
  return false;
};