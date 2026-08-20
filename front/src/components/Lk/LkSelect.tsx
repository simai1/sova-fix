import {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

import { filterOptionsByPrefix } from './LkSelect.search';
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
  maxHeight: number;
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
  searchable?: boolean;
  searchPlaceholder?: string;
  noMatchesText?: string;
  'aria-label'?: string;
};

const MENU_MAX_HEIGHT = 280;
const MENU_GAP = 6;

const selectChevron = (
  <svg className="ui-select__chevron" width="12" height="8" viewBox="0 0 12 8" aria-hidden="true">
    <path
      d="M1 1L6 6L11 1"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

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
  searchable = false,
  searchPlaceholder,
  noMatchesText = 'Объекты не найдены',
  'aria-label': ariaLabel,
}: Props): JSX.Element => {
  const reactId = useId();
  const triggerId = id ?? `ui-select-${reactId}`;
  const listboxId = `${triggerId}-listbox`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [query, setQuery] = useState('');

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const selectedOption = options.find((option) => option.value === value);
  const selectedLabel = selectedOption?.label;
  const visibleOptions = useMemo(
    () => (searchable ? filterOptionsByPrefix(options, query) : options),
    [options, query, searchable],
  );
  const visibleSelectedIndex = visibleOptions.findIndex((option) => option.value === value);

  const getControl = useCallback(
    (): HTMLButtonElement | HTMLInputElement | null => searchInputRef.current ?? triggerRef.current,
    [],
  );

  const computeCoords = useCallback((): void => {
    const control = getControl();
    if (!control) return;

    const rect = control.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewportTop = viewport?.offsetTop ?? 0;
    const viewportBottom = viewportTop + (viewport?.height ?? window.innerHeight);
    const spaceBelow = Math.max(0, viewportBottom - rect.bottom);
    const spaceAbove = Math.max(0, rect.top - viewportTop);
    const openUp = spaceBelow < MENU_MAX_HEIGHT + MENU_GAP && spaceAbove > spaceBelow;
    const availableSpace = (openUp ? spaceAbove : spaceBelow) - MENU_GAP;

    setCoords({
      top: openUp ? rect.top : rect.bottom,
      left: rect.left,
      width: rect.width,
      openUp,
      maxHeight: Math.max(0, Math.min(MENU_MAX_HEIGHT, availableSpace)),
    });
  }, [getControl]);

  useLayoutEffect(() => {
    if (!open) return;
    computeCoords();
  }, [open, computeCoords]);

  useEffect(() => {
    if (!open) return;

    const handler = (): void => computeCoords();
    const viewport = window.visualViewport;
    window.addEventListener('resize', handler);
    document.addEventListener('scroll', handler, true);
    viewport?.addEventListener('resize', handler);
    viewport?.addEventListener('scroll', handler);

    return () => {
      window.removeEventListener('resize', handler);
      document.removeEventListener('scroll', handler, true);
      viewport?.removeEventListener('resize', handler);
      viewport?.removeEventListener('scroll', handler);
    };
  }, [open, computeCoords]);

  useEffect(() => {
    if (!open) return;

    const handler = (event: MouseEvent): void => {
      const target = event.target as Node;
      if (wrapperRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setQuery('');
      setOpen(false);
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(
      visibleSelectedIndex >= 0 ? visibleSelectedIndex : visibleOptions.length > 0 ? 0 : -1,
    );
    optionRefs.current.length = visibleOptions.length;
  }, [open, visibleOptions, visibleSelectedIndex]);

  useEffect(() => {
    if (!open || searchable) return;
    menuRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    optionRefs.current[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [open, activeIndex]);

  const close = useCallback(
    (restoreFocus = true): void => {
      setQuery('');
      setOpen(false);
      if (!restoreFocus) return;
      if (searchable) {
        searchInputRef.current?.blur();
      } else {
        triggerRef.current?.focus();
      }
    },
    [searchable],
  );

  const select = useCallback(
    (index: number): void => {
      const option = visibleOptions[index];
      if (!option) return;
      onChange(option.value);
      close();
    },
    [close, onChange, visibleOptions],
  );

  const moveActive = useCallback(
    (offset: number): void => {
      if (visibleOptions.length === 0) {
        setActiveIndex(-1);
        return;
      }

      setActiveIndex((current) => {
        if (current < 0) return offset > 0 ? 0 : visibleOptions.length - 1;
        return (current + offset + visibleOptions.length) % visibleOptions.length;
      });
    },
    [visibleOptions.length],
  );

  const onTriggerKey = (event: ReactKeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return;
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onMenuKey = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    } else if (visibleOptions.length === 0) {
      return;
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(visibleOptions.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (activeIndex >= 0) select(activeIndex);
    }
  };

  const onSearchKey = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Home' && visibleOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && visibleOptions.length > 0) {
      event.preventDefault();
      setActiveIndex(visibleOptions.length - 1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (activeIndex >= 0) select(activeIndex);
    }
  };

  const rootClass = [
    'ui-select',
    `ui-select--${size}`,
    open ? 'ui-select--open' : '',
    disabled ? 'ui-select--disabled' : '',
    searchable ? 'ui-select--searchable' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  const showPlaceholder = selectedLabel === undefined;
  const triggerLabel = selectedLabel ?? placeholder ?? 'Не выбрано';

  return (
    <div ref={wrapperRef} className={rootClass} style={style}>
      {searchable ? (
        <div className="ui-select__search-control">
          <input
            ref={searchInputRef}
            id={triggerId}
            type="search"
            role="combobox"
            className="ui-select__search-input"
            value={open ? query : (selectedLabel ?? '')}
            placeholder={open ? (searchPlaceholder ?? placeholder) : placeholder}
            enterKeyHint="search"
            autoComplete="off"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={
              open && activeIndex >= 0 ? `${triggerId}-opt-${activeIndex}` : undefined
            }
            aria-label={ariaLabel}
            disabled={disabled}
            onFocus={() => {
              if (disabled) return;
              setQuery('');
              setOpen(true);
            }}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onKeyDown={onSearchKey}
          />
          {selectChevron}
        </div>
      ) : (
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
            setOpen((previous) => !previous);
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
          {selectChevron}
        </button>
      )}

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
              tabIndex={searchable ? undefined : -1}
              className={[
                'ui-select__menu',
                coords.openUp ? 'ui-select__menu--up' : '',
                searchable ? 'ui-select__menu--searchable' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                position: 'fixed',
                top: coords.openUp ? undefined : coords.top + MENU_GAP,
                bottom: coords.openUp ? window.innerHeight - coords.top + MENU_GAP : undefined,
                left: coords.left,
                width: coords.width,
                maxHeight: coords.maxHeight,
              }}
              onKeyDown={searchable ? undefined : onMenuKey}
            >
              {visibleOptions.length === 0 ? (
                <div className="ui-select__option" aria-disabled="true">
                  <span className="ui-select__label">
                    {searchable && query.trim() ? noMatchesText : 'Нет вариантов'}
                  </span>
                </div>
              ) : (
                <ul className="ui-select__list">
                  {visibleOptions.map((option, index) => {
                    const isSelected = option.value === value;
                    const isActive = index === activeIndex;
                    const optionClass = [
                      'ui-select__option',
                      isSelected ? 'ui-select__option--selected' : '',
                      isActive ? 'ui-select__option--active' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');

                    return (
                      <li
                        key={option.value}
                        ref={(element) => {
                          optionRefs.current[index] = element;
                        }}
                        id={`${triggerId}-opt-${index}`}
                        role="option"
                        aria-selected={isSelected}
                        className={optionClass}
                        onMouseEnter={() => setActiveIndex(index)}
                        onClick={() => select(index)}
                      >
                        {option.color ? (
                          <UrgencyPill label={option.label} color={option.color} />
                        ) : (
                          <>
                            <span className="ui-select__dot" aria-hidden="true" />
                            <span className="ui-select__label">{option.label}</span>
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
