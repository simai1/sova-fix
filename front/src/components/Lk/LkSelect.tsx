import {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import UrgencyPill from './UrgencyPill';

export type LkSelectOption = {
  value: string;
  label: string;
  color?: string;
};

type Coords = {
  top: number;
  left: number;
  width: number;
  openUp: boolean;
};

type Props = {
  value: string;
  onChange: (next: string) => void;
  options: LkSelectOption[];
  placeholder?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  size?: 'md' | 'sm';
  style?: CSSProperties;
  'aria-label'?: string;
};

const MENU_MAX_HEIGHT = 280;
const MENU_GAP = 6;

const LkSelect = ({
  value,
  onChange,
  options,
  placeholder,
  id,
  disabled,
  className,
  size = 'md',
  style,
  'aria-label': ariaLabel,
}: Props): JSX.Element => {
  const reactId = useId();
  const triggerId = id ?? `ui-select-${reactId}`;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<Coords | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : undefined;
  const selectedLabel = selectedOption?.label;

  const computeCoords = useCallback((): void => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUp = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow;
    setCoords({
      top: openUp ? rect.top : rect.bottom,
      left: rect.left,
      width: rect.width,
      openUp,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    computeCoords();
  }, [open, computeCoords]);

  useEffect(() => {
    if (!open) return;
    const handler = (): void => computeCoords();
    window.addEventListener('resize', handler);
    document.addEventListener('scroll', handler, true);
    return () => {
      window.removeEventListener('resize', handler);
      document.removeEventListener('scroll', handler, true);
    };
  }, [open, computeCoords]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const el = optionRefs.current[activeIndex];
    el?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const close = useCallback((): void => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const select = useCallback(
    (idx: number): void => {
      const opt = options[idx];
      if (!opt) return;
      onChange(opt.value);
      setOpen(false);
      triggerRef.current?.focus();
    },
    [onChange, options],
  );

  const onTriggerKey = (e: ReactKeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKey = (e: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (options.length === 0) {
      if (e.key === 'Escape' || e.key === 'Tab') close();
      return;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (activeIndex >= 0) select(activeIndex);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  const rootClass = [
    'ui-select',
    `ui-select--${size}`,
    open ? 'ui-select--open' : '',
    disabled ? 'ui-select--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const showPlaceholder = selectedLabel === undefined;
  const triggerLabel = selectedLabel ?? placeholder ?? 'Не выбрано';

  return (
    <div ref={wrapperRef} className={rootClass} style={style}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        className="ui-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        onKeyDown={onTriggerKey}
      >
        {showPlaceholder ? (
          <span className="ui-select__placeholder">{triggerLabel}</span>
        ) : selectedOption?.color ? (
          <span className="ui-select__value">
            <UrgencyPill label={selectedOption.label} color={selectedOption.color} />
          </span>
        ) : (
          <span className="ui-select__value">{triggerLabel}</span>
        )}
        <svg
          className="ui-select__chevron"
          width="12"
          height="8"
          viewBox="0 0 12 8"
          aria-hidden="true"
        >
          <path
            d="M1 1L6 6L11 1"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && coords
        ? createPortal(
            <div
              ref={menuRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={triggerId}
              aria-activedescendant={
                activeIndex >= 0 ? `${triggerId}-opt-${activeIndex}` : undefined
              }
              tabIndex={-1}
              className={`ui-select__menu${coords.openUp ? ' ui-select__menu--up' : ''}`}
              style={{
                position: 'fixed',
                top: coords.openUp ? undefined : coords.top + MENU_GAP,
                bottom: coords.openUp ? window.innerHeight - coords.top + MENU_GAP : undefined,
                left: coords.left,
                width: coords.width,
              }}
              onKeyDown={onMenuKey}
            >
              {options.length === 0 ? (
                <div className="ui-select__option" aria-disabled="true">
                  <span className="ui-select__label">Нет вариантов</span>
                </div>
              ) : (
                <ul className="ui-select__list">
                  {options.map((opt, idx) => {
                    const isSelected = idx === selectedIndex;
                    const isActive = idx === activeIndex;
                    const cls = [
                      'ui-select__option',
                      isSelected ? 'ui-select__option--selected' : '',
                      isActive ? 'ui-select__option--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return (
                      <li
                        key={`${opt.value}-${idx}`}
                        ref={(el) => {
                          optionRefs.current[idx] = el;
                        }}
                        id={`${triggerId}-opt-${idx}`}
                        role="option"
                        aria-selected={isSelected}
                        className={cls}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onClick={() => select(idx)}
                      >
                        {opt.color ? (
                          <UrgencyPill label={opt.label} color={opt.color} />
                        ) : (
                          <>
                            <span className="ui-select__dot" aria-hidden="true" />
                            <span className="ui-select__label">{opt.label}</span>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default LkSelect;
