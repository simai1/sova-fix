import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import LkSelect from './LkSelect';

const options = [
  { value: '4', label: 'Боровое' },
  { value: '1', label: 'Вокзальная' },
  { value: '2', label: 'Воронеж' },
  { value: '3', label: 'Восточный' },
];

beforeAll(() => {
  Object.defineProperty(Element.prototype, 'scrollIntoView', {
    configurable: true,
    value: () => undefined,
  });
});

afterEach(cleanup);

describe('LkSelect searchable mode', () => {
  it('shows every option for an empty query and commits only a chosen prefix match', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LkSelect value="" onChange={onChange} options={options} searchable aria-label="Объект" />,
    );

    const input = screen.getByRole('combobox', { name: 'Объект' });
    expect(input.getAttribute('type')).toBe('search');
    expect(input.getAttribute('enterkeyhint')).toBe('search');
    expect(input.getAttribute('autocomplete')).toBe('off');

    await user.click(input);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Боровое',
      'Вокзальная',
      'Воронеж',
      'Восточный',
    ]);

    await user.type(input, 'ВОРО');
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual(['Воронеж']);
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole('option', { name: 'Воронеж' }));
    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('rejects a match from the middle of a name and shows the configured empty text', async () => {
    const user = userEvent.setup();
    render(
      <LkSelect
        value=""
        onChange={vi.fn()}
        options={options}
        searchable
        noMatchesText="Объекты не найдены"
        aria-label="Объект"
      />,
    );

    const input = screen.getByRole('combobox', { name: 'Объект' });
    await user.click(input);
    await user.type(input, 'рон');

    expect(screen.queryAllByRole('option')).toEqual([]);
    expect(screen.getByText('Объекты не найдены')).toBeTruthy();
  });

  it('chooses the active filtered option with Enter', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LkSelect value="" onChange={onChange} options={options} searchable aria-label="Объект" />,
    );

    const input = screen.getByRole('combobox', { name: 'Объект' });
    await user.click(input);
    await user.type(input, 'воро');
    await user.keyboard('{Enter}');

    expect(onChange).toHaveBeenCalledWith('2');
  });

  it('restores the selected label without changing the value after Escape', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LkSelect value="2" onChange={onChange} options={options} searchable aria-label="Объект" />,
    );

    const input = screen.getByRole('combobox', { name: 'Объект' });
    await user.click(input);
    await user.type(input, 'рон');
    await user.keyboard('{Escape}');

    expect(onChange).not.toHaveBeenCalled();
    expect((input as HTMLInputElement).value).toBe('Воронеж');
  });

  it('keeps the existing button control when searchable is omitted', () => {
    render(<LkSelect value="" onChange={vi.fn()} options={options} aria-label="Объект" />);

    expect(screen.getByRole('button', { name: 'Объект' })).toBeTruthy();
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
