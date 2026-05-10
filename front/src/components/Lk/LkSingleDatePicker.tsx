import { format } from 'date-fns';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
// rdp@10 реэкспортирует локали из date-fns/locale через свой подпуть,
// поэтому импортируем именно отсюда — единый источник для типов и данных.
import { ru } from 'react-day-picker/locale';
import { createPortal } from 'react-dom';

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
};

type Position = {
  top: number;
  left: number;
  width: number;
};

// Визуальный gap между триггером и popover'ом — иначе край календаря «прилипает»
// к нижней границе input'а и focus-ring триггера сливается с border'ом popover'а.
const POPOVER_GAP_PX = 4;

const formatDate = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'dd.MM.yyyy');
};

// Single-date вариант LkDatePicker. Делим стили (`.lk-datepicker*`,
// rdp-overrides из _datepicker.scss) с range-пикером — там
// `.rdp-selected:not(.rdp-range_*)` уже корректно рисует «жёлтый круг» для
// одиночного выбора. Логика обёртки совпадает (портал, position:fixed,
// click-outside, Esc), отличается только тип value/draft и набор кнопок
// футера (без «Применить» — single-mode коммитим сразу при выборе дня).
const LkSingleDatePicker = ({
  value,
  onChange,
  placeholder = 'Выберите дату',
  disabled,
}: Props): JSX.Element => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);

  // Позиционирование popover относительно триггера. См. комментарии в
  // LkDatePicker.tsx: capture-listener на scroll нужен для scrollable-родителей.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const recompute = (): void => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      setPos({ top: rect.bottom + POPOVER_GAP_PX, left: rect.left, width: rect.width });
    };
    recompute();
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [open]);

  useEffect(() => {
    if (open && popoverRef.current) {
      popoverRef.current.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent): void => {
      const target = e.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const display = formatDate(value);
  const hasValue = display.length > 0;

  const handleToggle = (): void => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleClear = (): void => {
    onChange(null);
    setOpen(false);
  };

  const handleToday = (): void => {
    onChange(new Date());
    setOpen(false);
  };

  // rdp@10: OnSelectHandler<Date | undefined> в single-mode даёт сам выбранный
  // день. Сразу коммитим в onChange и закрываем popover — без отдельной
  // кнопки «Применить», как в Notion/Linear single-date пикерах.
  const handleSelect = (date: Date | undefined): void => {
    onChange(date ?? null);
    setOpen(false);
  };

  return (
    <div className={`lk-datepicker${hasValue ? '' : ' lk-datepicker--placeholder'}`}>
      <button
        ref={triggerRef}
        type="button"
        className="lk-input lk-datepicker__trigger"
        onClick={handleToggle}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg
          className="lk-datepicker__trigger-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span className="lk-datepicker__trigger-value">{display || placeholder}</span>
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={popoverRef}
              className="lk-datepicker__popover"
              style={{
                position: 'fixed',
                top: pos.top,
                left: pos.left,
                minWidth: pos.width,
              }}
              role="dialog"
              aria-label="Выбор даты"
              tabIndex={-1}
            >
              <DayPicker
                mode="single"
                weekStartsOn={1}
                locale={ru}
                selected={value ?? undefined}
                onSelect={handleSelect}
                numberOfMonths={1}
              />
              <div className="lk-datepicker__footer">
                <button type="button" className="lk-datepicker__btn" onClick={handleToday}>
                  Сегодня
                </button>
                <span className="lk-datepicker__footer-spacer" aria-hidden />
                <button type="button" className="lk-datepicker__btn" onClick={handleClear}>
                  Очистить
                </button>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
};

export default LkSingleDatePicker;
