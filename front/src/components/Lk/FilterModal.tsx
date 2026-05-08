import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

import { LkObject, LkStatus, LkUrgency } from '@/API/rtkQuery/lk.api';
import LkChipSelect, { LkChipOption } from '@/components/Lk/LkChipSelect';
import LkDatePicker from '@/components/Lk/LkDatePicker';
import LkSelect, { LkSelectOption } from '@/components/Lk/LkSelect';
import { LkUnitOption } from '@/utils/lkUnits';

export type LkFilterValue = {
  unitId?: string;
  objectId?: string;
  statusId?: string;
  urgencyId?: string;
  dateFrom?: string;
  dateTo?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  value: LkFilterValue;
  onApply: (next: LkFilterValue) => void;
  options: {
    objects: LkObject[];
    statuses: LkStatus[];
    urgencies: LkUrgency[];
    units: LkUnitOption[];
  };
};

const empty: LkFilterValue = {};

const FilterModal = ({ open, onClose, value, onApply, options }: Props): JSX.Element | null => {
  const [draft, setDraft] = useState<LkFilterValue>(value);

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  // ВАЖНО: все хуки (useMemo ниже) должны вызываться безусловно и в одном
  // порядке на каждый рендер. Раньше `if (!open) return null` стоял до useMemo'ов,
  // и при первом open=true React видел «3 хука вместо 2» → Rules-of-Hooks fail
  // («Rendered more hooks than during the previous render»). Поэтому все
  // useMemo'ы выше early-return'а; null-return выводится только после расчёта
  // мемо-значений (они дешёвые, без побочных эффектов).
  const unitOptions: LkSelectOption[] = useMemo(
    () => [
      { value: '', label: 'Все подразделения' },
      ...options.units.map((u) => ({ value: u.id, label: u.name })),
    ],
    [options.units],
  );

  // При выбранном unitId сужаем список объектов до объектов этого подразделения.
  const filteredObjects = useMemo(() => {
    if (!draft.unitId) return options.objects;
    return options.objects.filter((o) => o.unit?.id === draft.unitId);
  }, [options.objects, draft.unitId]);

  const objectOptions: LkSelectOption[] = useMemo(
    () => [
      { value: '', label: 'Все объекты' },
      ...filteredObjects.map((o) => ({ value: o.id, label: o.name })),
    ],
    [filteredObjects],
  );
  // Для chip-select'ов «пустой» опции нет — пустое значение моделируется
  // снятием выбора (повторный клик по активному чипу). См. LkChipSelect.
  const statusOptions: LkChipOption[] = useMemo(
    () => options.statuses.map((s) => ({ value: s.id, label: s.name })),
    [options.statuses],
  );
  const urgencyOptions: LkChipOption[] = useMemo(
    () => options.urgencies.map((u) => ({ value: u.id, label: u.name })),
    [options.urgencies],
  );

  if (!open) return null;

  const update = <K extends keyof LkFilterValue>(key: K, val: LkFilterValue[K]): void => {
    setDraft((prev) => {
      const next = { ...prev, [key]: val };
      // Каскад Unit → Object: если меняется Unit и текущий objectId
      // принадлежит другому Unit — сбрасываем objectId. Это предотвращает
      // невалидное состояние «Unit X + Object Y из Unit Z».
      if (key === 'unitId' && val && prev.objectId) {
        const obj = options.objects.find((o) => o.id === prev.objectId);
        if (obj?.unit?.id !== val) next.objectId = undefined;
      }
      return next;
    });
  };

  const handleApply = (): void => {
    const cleaned: LkFilterValue = {};
    (Object.keys(draft) as Array<keyof LkFilterValue>).forEach((k) => {
      const v = draft[k];
      if (v !== undefined && v !== '') cleaned[k] = v as never;
    });
    onApply(cleaned);
    onClose();
  };

  const handleReset = (): void => {
    setDraft(empty);
    onApply(empty);
    onClose();
  };

  return (
    <div
      className="lk-modal__overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="lk-modal__sheet" role="dialog" aria-modal="true">
        <h2 className="lk-modal__title">Фильтры</h2>

        <div className="lk-field">
          <label className="lk-field__label" htmlFor="lk-filter-unit">
            Подразделение
          </label>
          <LkSelect
            id="lk-filter-unit"
            value={draft.unitId ?? ''}
            onChange={(v) => update('unitId', v || undefined)}
            options={unitOptions}
          />
        </div>

        <div className="lk-field">
          <label className="lk-field__label" htmlFor="lk-filter-object">
            Объект
          </label>
          <LkSelect
            id="lk-filter-object"
            value={draft.objectId ?? ''}
            onChange={(v) => update('objectId', v || undefined)}
            options={objectOptions}
          />
        </div>

        <div className="lk-field">
          <div className="lk-field__label" id="lk-filter-status-label">
            Статус
          </div>
          <LkChipSelect
            id="lk-filter-status"
            value={draft.statusId}
            onChange={(v) => update('statusId', v)}
            options={statusOptions}
            ariaLabel="Статус заявки"
          />
        </div>

        <div className="lk-field">
          <div className="lk-field__label" id="lk-filter-urgency-label">
            Срочность
          </div>
          <LkChipSelect
            id="lk-filter-urgency"
            value={draft.urgencyId}
            onChange={(v) => update('urgencyId', v)}
            options={urgencyOptions}
            ariaLabel="Срочность заявки"
          />
        </div>

        <div className="lk-field">
          <div className="lk-field__label">Период</div>
          <LkDatePicker
            value={
              draft.dateFrom || draft.dateTo
                ? {
                    from: draft.dateFrom ? new Date(draft.dateFrom) : undefined,
                    to: draft.dateTo ? new Date(draft.dateTo) : undefined,
                  }
                : null
            }
            onChange={(range) => {
              setDraft((prev) => ({
                ...prev,
                dateFrom: range?.from ? format(range.from, 'yyyy-MM-dd') : undefined,
                dateTo: range?.to ? format(range.to, 'yyyy-MM-dd') : undefined,
              }));
            }}
            placeholder="— выбрать —"
          />
        </div>

        <div className="lk-modal__actions">
          <button
            type="button"
            className="lk-button lk-button--ghost lk-button--block"
            onClick={handleReset}
          >
            Сбросить
          </button>
          <button
            type="button"
            className="lk-button lk-button--primary lk-button--block"
            onClick={handleApply}
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterModal;
