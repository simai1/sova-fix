import {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { getReadableTextColor } from '@/utils/contrastColor';

export type LkChipOption = {
  value: string;
  label: string;
  color?: string;
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
  const groupId = id ?? `ui-chip-select-${reactId}`;

  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusIdx, setFocusIdx] = useState<number>(-1);

  const selectedIdx = value === undefined ? -1 : options.findIndex((o) => o.value === value);
  const tabIdx = selectedIdx >= 0 ? selectedIdx : 0;

  useEffect(() => {
    if (value === undefined) setFocusIdx(-1);
  }, [value]);

  const moveFocus = (nextIdx: number): void => {
    const target = itemRefs.current[nextIdx];
    if (!target) return;
    setFocusIdx(nextIdx);
    target.focus();
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

  const rootClass = ['ui-chip-select', className].filter(Boolean).join(' ');

  return (
    <div role="radiogroup" aria-label={ariaLabel} id={groupId} className={rootClass}>
      {options.map((opt, idx) => {
        const isChecked = opt.value === value;
        const isTabbable = idx === (focusIdx >= 0 ? focusIdx : tabIdx);
        const cls = [
          'ui-chip-select__item',
          isChecked ? 'ui-chip-select__item--active' : '',
          opt.color ? 'ui-chip-select__item--colored' : '',
        ]
          .filter(Boolean)
          .join(' ');
        const colorStyle = opt.color
          ? ({
              '--chip-color': opt.color,
              '--chip-fg': getReadableTextColor(opt.color),
            } as CSSProperties)
          : undefined;
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
            className={cls}
            style={colorStyle}
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
