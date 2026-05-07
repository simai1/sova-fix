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

  return (
    <div className="lk-search">
      <input
        type="search"
        className="lk-search__input"
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
      />
    </div>
  );
};

export default LkSearchInput;
