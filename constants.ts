// Base Network Brand Colors
export const COLORS = {
  background: '#000000', // Pure Black for higher contrast like gmove
  surface: '#111111',
  primary: '#0052FF', // Base Blue
  primaryHover: '#004ad9',
  text: '#FFFFFF',
  textSecondary: '#9CA3AF',
  gridBackground: '#1A1A1A',
  gridEmptyCell: '#262626',
};

// Tile colors mapping (Value -> Tailwind classes or Hex)
// We use a high contrast blue gradient scale
export const TILE_COLORS: Record<number, { bg: string; text: string; shadow: string }> = {
  2: { bg: '#FFFFFF', text: '#000000', shadow: '0 0 0px transparent' },
  4: { bg: '#E0E7FF', text: '#000000', shadow: '0 0 0px transparent' },
  8: { bg: '#C7D2FE', text: '#000000', shadow: '0 0 0px transparent' },
  16: { bg: '#A5B4FC', text: '#000000', shadow: '0 0 0px transparent' },
  32: { bg: '#818CF8', text: '#FFFFFF', shadow: '0 0 10px rgba(129, 140, 248, 0.3)' },
  64: { bg: '#6366F1', text: '#FFFFFF', shadow: '0 0 10px rgba(99, 102, 241, 0.4)' },
  128: { bg: '#4F46E5', text: '#FFFFFF', shadow: '0 0 15px rgba(79, 70, 229, 0.5)' },
  256: { bg: '#4338CA', text: '#FFFFFF', shadow: '0 0 20px rgba(67, 56, 202, 0.6)' },
  512: { bg: '#3730A3', text: '#FFFFFF', shadow: '0 0 25px rgba(55, 48, 163, 0.7)' },
  1024: { bg: '#312E81', text: '#FFFFFF', shadow: '0 0 30px rgba(49, 46, 129, 0.8)' },
  2048: { bg: '#0052FF', text: '#FFFFFF', shadow: '0 0 50px #0052FF' }, // The Base Goal
};

export const GRID_SIZE = 4;
export const WINNING_SCORE = 2048;

export const BADGE_LEVELS = [
  { id: 1, score: 1000, label: 'Based', color: '#FFFFFF' },   
  { id: 2, score: 5000, label: 'Builder', color: '#0052FF' }, 
  { id: 3, score: 10000, label: 'Superchain', color: '#00D2FF' }, 
  { id: 4, score: 20000, label: 'Legend', color: '#FFD700' }  
];
