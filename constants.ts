// Base Network Brand Colors
export const COLORS = {
  background: '#0F1115',
  surface: '#1E2025',
  primary: '#0052FF', // Base Blue
  primaryHover: '#004ad9',
  text: '#FFFFFF',
  textSecondary: '#8A919E',
  gridBackground: '#2B303B',
  gridEmptyCell: '#3C4250',
};

// Tile colors mapping (Value -> Tailwind classes or Hex)
// We use a blue gradient scale to match Base aesthetics
export const TILE_COLORS: Record<number, { bg: string; text: string; shadow: string }> = {
  2: { bg: '#E3F2FD', text: '#0052FF', shadow: '0 0 10px rgba(227, 242, 253, 0.2)' },
  4: { bg: '#BBDEFB', text: '#0052FF', shadow: '0 0 10px rgba(187, 222, 251, 0.3)' },
  8: { bg: '#90CAF9', text: '#0F1115', shadow: '0 0 15px rgba(144, 202, 249, 0.4)' },
  16: { bg: '#64B5F6', text: '#0F1115', shadow: '0 0 15px rgba(100, 181, 246, 0.5)' },
  32: { bg: '#42A5F5', text: '#FFFFFF', shadow: '0 0 20px rgba(66, 165, 245, 0.6)' },
  64: { bg: '#2196F3', text: '#FFFFFF', shadow: '0 0 20px rgba(33, 150, 243, 0.7)' },
  128: { bg: '#1E88E5', text: '#FFFFFF', shadow: '0 0 25px rgba(30, 136, 229, 0.8)' },
  256: { bg: '#1976D2', text: '#FFFFFF', shadow: '0 0 25px rgba(25, 118, 210, 0.9)' },
  512: { bg: '#1565C0', text: '#FFFFFF', shadow: '0 0 30px rgba(21, 101, 192, 1)' },
  1024: { bg: '#0D47A1', text: '#FFFFFF', shadow: '0 0 35px rgba(13, 71, 161, 1)' },
  2048: { bg: '#0052FF', text: '#FFFFFF', shadow: '0 0 50px #0052FF' }, // The Base Goal
};

export const GRID_SIZE = 4;
export const WINNING_SCORE = 2048;

export const BADGE_LEVELS = [
  { id: 1, score: 5000, label: 'Scout', color: '#CD7F32' },   // Bronze
  { id: 2, score: 10000, label: 'Expert', color: '#C0C0C0' }, // Silver
  { id: 3, score: 15000, label: 'Master', color: '#FFD700' }, // Gold
  { id: 4, score: 20000, label: 'Legend', color: '#0052FF' }  // Base Blue
];