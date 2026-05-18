import { format } from 'date-fns';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
// rdp@10 реэкспортирует локали из date-fns/locale через свой подпуть,
// поэтому импортируем именно отсюда — единый источник для типов и данных.
import { ru } from 'react-day-picker/locale';
import { createPortal } from 'react-dom';

type Props = {
  value: DateRange | null;
  onChange: (range: DateRange | null) => void;
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

// Минимальный отступ popover'а от кромки viewport'а, когда он открывается вверх
// и даже там не помещается целиком — упирается в этот отступ, а не в край.
const VIEWPORT_MARGIN_PX = 8;

// Mobile Portrait по шкале _tokens.scss: max-width 767px. На этой ширине
// anchored-popover уходит за нижний край viewport'а и rdp-grid растягивается —
// переключаемся на bottom-sheet (см. _datepicker.scss § __overlay/__popover--sheet).
const MOBILE_SHEET_MQ = '(max-width: 767px)';

const getMatchesMobile = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_SHEET_MQ).matches;

const formatRange = (range: DateRange | null): string => {
  if (!range || (!range.from && !range.to)) return '';
  const f = range.from ? format(range.from, 'dd.MM.yyyy') : '—';
  const t = range.to ? format(range.to, 'dd.MM.yyyy') : '—';
  return `${f} — ${t}`;
};

const isEmptyRange = (range: DateRange | undefined): boolean => {
  if (!range) return true;
  return !range.from && !range.to;
};

const LkDatePicker = ({
  value,
  onChange,
  placeholder = 'Выберите период',
  disabled,
}: Props): JSX.Element => {
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);
  const [draft, setDraft] = useState<DateRange | undefined>(value ?? undefined);
  const [isMobile, setIsMobile] = useState<boolean>(getMatchesMobile);

  // Синхронизируем черновик с внешним value, пока popover закрыт:
  // если родитель сбросил фильтр снаружи — внутреннее состояние догоняет.
  useEffect(() => {
    if (!open) setDraft(value ?? undefined);
  }, [value, open]);

  // Слушаем смену брейкпоинта (поворот девайса / DevTools-resize), чтобы
  // переключаться между anchored-popover и bottom-sheet без перезагрузки.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia(MOBILE_SHEET_MQ);
    const handler = (e: MediaQueryListEvent): void => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Позиционирование popover относительно триггера — только в desktop-режиме.
  // На мобильной bottom-sheet прибит ко дну экрана, координаты не нужны.
  // useLayoutEffect — чтобы координаты применились до первой отрисовки и не
  // было «прыжка» из 0,0. Popover до расчёта позиции уже смонтирован, но скрыт
  // (visibility:hidden) — это нужно, чтобы измерить его высоту и решить,
  // открывать вниз или вверх. Recompute при scroll/resize: useCapture=true в
  // scroll-listener'е нужен, чтобы ловить scroll внутри scrollable parent'ов
  // (FilterModal внутри .lk-modal__sheet имеет overflow:auto — bubbling-scroll
  // туда не доходит).
  useLayoutEffect(() => {
    if (!open || isMobile || !triggerRef.current) return;
    const recompute = (): void => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const popoverH = popoverRef.current?.offsetHeight ?? 0;
      const spaceBelow = window.innerHeight - rect.bottom - POPOVER_GAP_PX;
      let top = rect.bottom + POPOVER_GAP_PX;
      // Если под триггером календарь целиком не помещается — открываем вверх,
      // прижимая к верхней кромке viewport'а, чтобы он был виден полностью
      // при любом масштабе страницы.
      if (popoverH > 0 && popoverH > spaceBelow) {
        top = Math.max(VIEWPORT_MARGIN_PX, rect.top - POPOVER_GAP_PX - popoverH);
      }
      // scroll-capture/resize/ResizeObserver зовут recompute часто и обычно с
      // теми же координатами — возвращаем прежний объект, чтобы React пропустил
      // лишний re-render всего календаря.
      setPos((prev) =>
        prev && prev.top === top && prev.left === rect.left && prev.width === rect.width
          ? prev
          : { top, left: rect.left, width: rect.width },
      );
    };
    recompute();
    // Высота rdp-сетки зависит от числа недель в месяце (4–6 строк) — следим
    // за ресайзом popover'а, чтобы пересчитать flip при навигации по месяцам.
    const ro = new ResizeObserver(recompute);
    if (popoverRef.current) ro.observe(popoverRef.current);
    window.addEventListener('scroll', recompute, true);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('scroll', recompute, true);
      window.removeEventListener('resize', recompute);
    };
  }, [open, isMobile]);

  // Автофокус popover'а при открытии — закрывает наследие WAI-ARIA dialog
  // pattern: role="dialog" подразумевает, что фокус переходит внутрь при
  // открытии. Сам контейнер фокусируем (tabIndex=-1), дальнейшую навигацию
  // по дням обрабатывает RDP внутри (стрелки, Enter).
  useEffect(() => {
    if (open && popoverRef.current) {
      popoverRef.current.focus();
    }
  }, [open]);

  // Клик-вне (по mousedown, чтобы успеть до click) и Esc для закрытия.
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

  const display = formatRange(value);
  const hasValue = display.length > 0;

  const handleToggle = (): void => {
    if (disabled) return;
    setOpen((prev) => !prev);
  };

  const handleApply = (): void => {
    onChange(draft && !isEmptyRange(draft) ? draft : null);
    setOpen(false);
  };

  const handleClear = (): void => {
    setDraft(undefined);
    onChange(null);
  };

  const handleToday = (): void => {
    const today = new Date();
    setDraft({ from: today, to: today });
  };

  // rdp@10: OnSelectHandler<DateRange | undefined> принимает (range, triggerDate, modifiers, e).
  // Нас интересует только сам range — оборачиваем, чтобы setDraft получил совместимую сигнатуру.
  const handleSelect = (range: DateRange | undefined): void => {
    setDraft(range);
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

      {open
        ? createPortal(
            isMobile ? (
              <div className="lk-datepicker__overlay">
                <div
                  ref={popoverRef}
                  className="lk-datepicker__popover lk-datepicker__popover--sheet"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Выбор периода"
                  tabIndex={-1}
                >
                  <DayPicker
                    mode="range"
                    weekStartsOn={1}
                    locale={ru}
                    selected={draft}
                    onSelect={handleSelect}
                    numberOfMonths={1}
                  />
                  <div className="lk-datepicker__footer">
                    <button type="button" className="lk-datepicker__btn" onClick={handleToday}>
                      Сегодня
                    </button>
                    <button type="button" className="lk-datepicker__btn" onClick={handleClear}>
                      Очистить
                    </button>
                    <span className="lk-datepicker__footer-spacer" aria-hidden />
                    <button
                      type="button"
                      className="lk-datepicker__btn lk-datepicker__btn--primary"
                      onClick={handleApply}
                    >
                      Применить
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                ref={popoverRef}
                className="lk-datepicker__popover"
                style={{
                  position: 'fixed',
                  top: pos ? pos.top : 0,
                  left: pos ? pos.left : 0,
                  // До первого расчёта позиции popover скрыт, но уже в DOM —
                  // иначе нечем измерить высоту для выбора направления flip'а.
                  visibility: pos ? 'visible' : 'hidden',
                }}
                role="dialog"
                aria-label="Выбор периода"
                tabIndex={-1}
              >
                <DayPicker
                  mode="range"
                  weekStartsOn={1}
                  locale={ru}
                  selected={draft}
                  onSelect={handleSelect}
                  numberOfMonths={1}
                />
                <div className="lk-datepicker__footer">
                  <button type="button" className="lk-datepicker__btn" onClick={handleToday}>
                    Сегодня
                  </button>
                  <button type="button" className="lk-datepicker__btn" onClick={handleClear}>
                    Очистить
                  </button>
                  <span className="lk-datepicker__footer-spacer" aria-hidden />
                  <button
                    type="button"
                    className="lk-datepicker__btn lk-datepicker__btn--primary"
                    onClick={handleApply}
                  >
                    Применить
                  </button>
                </div>
              </div>
            ),
            document.body,
          )
        : null}
    </div>
  );
};

export default LkDatePicker;
