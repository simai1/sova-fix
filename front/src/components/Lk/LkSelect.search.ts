type LabelledOption = {
  label: string;
};

const russianCollator = new Intl.Collator('ru', {
  sensitivity: 'base',
  numeric: true,
});

const normalize = (value: string): string => value.trim().toLocaleLowerCase('ru-RU');

export const sortOptionsAlphabetically = <T extends LabelledOption>(options: readonly T[]): T[] =>
  [...options].sort((left, right) => russianCollator.compare(left.label, right.label));

export const filterOptionsByPrefix = <T extends LabelledOption>(
  options: readonly T[],
  query: string,
): T[] => {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [...options];
  return options.filter((option) => normalize(option.label).startsWith(normalizedQuery));
};
