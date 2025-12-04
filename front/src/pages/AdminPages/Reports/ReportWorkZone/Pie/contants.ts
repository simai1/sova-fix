export const COLORS = [
  // Желтые / оранжевые
  '#FFE20D', // status/01/default
  '#F0C000', // status/01/active
  '#FFA20D', // status/02/default
  '#E8590C', // status/02/active
  '#D54309', // status/03/default
  '#B23808', // status/03/active

  // Красные / бордовые
  '#800020', // status/04/default
  '#66001A', // status/04/active

  // Серые / бежевые
  '#C9C0B4', // status/05/default
  '#A69E94', // status/05/active

  // Розовые
  '#FFD4E2', // status/06/default
  '#E5ACBF', // status/06/active

  // Фиолетовые
  '#BC89EE', // status/07/default
  '#A46FD9', // status/07/active
  '#6F2C91', // status/08/default
  '#441B59', // status/08/active

  // Синие / голубые
  '#C6D8FF', // status/09/default
  '#8FA2CC', // status/09/active
  '#375BD2', // status/10/default
  '#0F2F99', // status/10/active

  // Зеленые / бирюзовые
  '#005D5D', // status/11/default
  '#003333', // status/11/active
  '#C5E384', // status/12/default
  '#9BB268', // status/12/active

  '#FFB6C1', // светло-розовый
  '#FF69B4', // ярко-розовый
  '#BA55D3', // фиолетовый средний
  '#9370DB', // светлый фиолетовый
  '#40E0D0', // бирюзовый
  '#20B2AA', // темная бирюза
  '#FFD700', // золотой
  '#FFA500', // оранжевый яркий
  '#ADFF2F', // зеленовато-желтый
  '#32CD32', // ярко-зеленый
  '#00CED1', // темная бирюза
  '#1E90FF', // dodger blue
  '#6495ED', // cornflower blue
  '#FF6347', // tomato
  '#FF4500', // orange red
];

function shuffleColors(colors: string[]): string[] {
  return [...colors].sort(() => Math.random() - 0.5);
}

export const PIE_COLORS = shuffleColors(COLORS);
