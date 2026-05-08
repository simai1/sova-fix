import { useEffect, useState } from 'react';

import { useDebouncedValue } from '@/hooks/useDebouncedValue';

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  delay?: number;
};

const LkSearchInput = ({
  value,
  onChange,
  placeholder = 'Поиск...',
  delay = 300,
}: Props): JSX.Element => {
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, delay);

  // Внешнее значение пробрасываем внутрь, если изменилось извне (сброс фильтров и т.п.)
  useEffect(() => {
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (debounced !== value) {
      onChange(debounced);
    }
    // onChange/value намеренно вне deps — отдаём только debounced наружу
  }, [debounced]);

  const handleClear = (): void => {
    setLocal('');
    // Сбрасываем наружу немедленно, не дожидаясь debounce — UX clear-кнопки
    // ожидает мгновенного отклика; иначе при повторном клике/наборе значение
    // успеет затереться debounced-эффектом.
    onChange('');
  };

  return (
    <div className="lk-search">
      <svg
        className="lk-search__icon"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        className="lk-search__input"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
      />
      {local ? (
        <button
          type="button"
          className="lk-search__clear"
          onClick={handleClear}
          aria-label="Очистить"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      ) : null}
    </div>
  );
};

export default LkSearchInput;
