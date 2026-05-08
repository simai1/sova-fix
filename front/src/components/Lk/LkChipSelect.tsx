import { KeyboardEvent as ReactKeyboardEvent, useEffect, useId, useRef, useState } from 'react';

export type LkChipOption = {
  value: string;
  label: string;
};

type Props = {
  options: LkChipOption[];
  value?: string;
  onChange: (next: string | undefined) => void;
  ariaLabel: string;
  id?: string;
  disabled?: boolean;
  className?: string;
};

// Single-select группа чипов с семантикой radiogroup. От LkSelect отличается
// тем, что нет «пустой» опции в списке — пустое значение моделируется
// снятием выбора (клик по активному чипу). Это удобнее для коротких списков
// (статус, срочность), где dropdown избыточен.
//
// A11y-инвариант: используем radiogroup + radio (а не toolbar + button).
// Это даёт screen-reader'ам корректное чтение «выбран X из N» и стандартную
// навигацию стрелками. Активный chip всё равно кликабельно «снимается» —
// это расширение поверх радио-семантики, оно не ломает ARIA (aria-checked
// просто переключается в false).
const LkChipSelect = ({
  options,
  value,
  onChange,
  ariaLabel,
  id,
  disabled,
  className,
}: Props): JSX.Element => {
  const reactId = useId();
  const groupId = id ?? `lk-chip-select-${reactId}`;

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusIdx, setFocusIdx] = useState<number>(-1);

  // Roving tabindex: только активный (или первый) чип получает tabIndex=0,
  // остальные -1. Внутри группы навигация через стрелки. Это стандарт для
  // radiogroup и предотвращает «прохождение через все 5 чипов» Tab'ом.
  const selectedIdx = value === undefined ? -1 : options.findIndex((o) => o.value === value);
  const tabIdx = selectedIdx >= 0 ? selectedIdx : 0;

  useEffect(() => {
    // Если value пришёл извне (например, sync из FilterModal draft) и мы
    // только что move'ались стрелкой — focusIdx не сбрасываем; иначе фокус
    // «прыгал» бы между внешними обновлениями. Сбрасываем только когда
    // value обнулилось (Reset).
    if (value === undefined) setFocusIdx(-1);
  }, [value]);

  const moveFocus = (nextIdx: number): void => {
    const target = itemRefs.current[nextIdx];
    if (!target) return;
    setFocusIdx(nextIdx);
    target.focus();
    // По radiogroup-паттерну стрелки сразу применяют выбор (как нативный
    // <input type=radio>). Это согласовано с user-expectation для chip-
    // селекта статуса: ←/→ меняет фильтр на лету.
    const opt = options[nextIdx];
    if (opt) onChange(opt.value);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLButtonElement>, idx: number): void => {
    if (disabled || options.length === 0) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      moveFocus((idx + 1) % options.length);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      moveFocus((idx - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      moveFocus(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      moveFocus(options.length - 1);
    } else if (e.key === ' ' || e.key === 'Enter') {
      // Space/Enter — toggle: позволяем снять выбор активного чипа через
      // клавиатуру (зеркало клика).
      e.preventDefault();
      const opt = options[idx];
      if (!opt) return;
      onChange(opt.value === value ? undefined : opt.value);
    }
  };

  const onClick = (idx: number): void => {
    if (disabled) return;
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value === value ? undefined : opt.value);
  };

  const rootClass = ['lk-chip-select', className].filter(Boolean).join(' ');

  return (
    <div role="radiogroup" aria-label={ariaLabel} id={groupId} className={rootClass}>
      {options.map((opt, idx) => {
        const isChecked = opt.value === value;
        const isTabbable = idx === (focusIdx >= 0 ? focusIdx : tabIdx);
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isChecked}
            disabled={disabled}
            tabIndex={isTabbable ? 0 : -1}
            ref={(el) => {
              itemRefs.current[idx] = el;
            }}
            className={`lk-chip-select__item${isChecked ? ' lk-chip-select__item--active' : ''}`}
            onClick={() => onClick(idx)}
            onKeyDown={(e) => onKeyDown(e, idx)}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};

export default LkChipSelect;
