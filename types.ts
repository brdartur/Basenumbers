export type Grid = number[][];

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
}

export interface MoveResult {
  grid: Grid;
  score: number;
  moved: boolean;
}

export interface TileProps {
  value: number;
  x: number;
  y: number;
}