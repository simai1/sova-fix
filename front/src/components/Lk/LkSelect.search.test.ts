import { describe, expect, it } from 'vitest';

import { filterOptionsByPrefix, sortOptionsAlphabetically } from './LkSelect.search';

const options = [
  { value: '3', label: 'Якорь' },
  { value: '2', label: 'воронеж' },
  { value: '1', label: 'Арбат' },
  { value: '4', label: 'Боровое' },
];

describe('searchable select options', () => {
  it('sorts Russian labels alphabetically without mutating the source', () => {
    const source = [...options];
    const result = sortOptionsAlphabetically(source);

    expect(result.map(({ label }) => label)).toEqual(['Арбат', 'Боровое', 'воронеж', 'Якорь']);
    expect(source).toEqual(options);
    expect(result).not.toBe(source);
  });

  it('returns the complete ordered list for an empty query', () => {
    const ordered = sortOptionsAlphabetically(options);

    expect(filterOptionsByPrefix(ordered, '').map(({ label }) => label)).toEqual([
      'Арбат',
      'Боровое',
      'воронеж',
      'Якорь',
    ]);
  });

  it('matches only from the start without regard to case', () => {
    const ordered = sortOptionsAlphabetically(options);

    expect(filterOptionsByPrefix(ordered, 'ВОРО')).toEqual([{ value: '2', label: 'воронеж' }]);
    expect(filterOptionsByPrefix(ordered, 'рон')).toEqual([]);
  });

  it('ignores surrounding whitespace in the query', () => {
    const ordered = sortOptionsAlphabetically(options);

    expect(filterOptionsByPrefix(ordered, '  бор  ')).toEqual([{ value: '4', label: 'Боровое' }]);
  });
});
