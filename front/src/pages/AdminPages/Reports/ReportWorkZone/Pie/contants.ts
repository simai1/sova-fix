export const COLORS = [
  '#FFE20D',
  '#F0C000',
  '#FFA20D',
  '#E8590C',
  '#D54309',
  '#B23808',

  '#800020',
  '#66001A',

  '#C9C0B4',
  '#A69E94',

  '#FFD4E2',
  '#E5ACBF',

  '#BC89EE',
  '#A46FD9',
  '#6F2C91',
  '#441B59',

  '#C6D8FF',
  '#8FA2CC',
  '#375BD2',
  '#0F2F99',

  '#005D5D',
  '#003333',
  '#C5E384',
  '#9BB268',

  '#FFB6C1',
  '#FF69B4',
  '#BA55D3',
  '#9370DB',
  '#40E0D0',
  '#20B2AA',
  '#FFD700',
  '#FFA500',
  '#ADFF2F',
  '#32CD32',
  '#00CED1',
  '#1E90FF',
  '#6495ED',
  '#FF6347',
  '#FF4500',
];

function shuffleColors(colors: string[]): string[] {
  return [...colors].sort(() => Math.random() - 0.5);
}

export const PIE_COLORS = shuffleColors(COLORS);
