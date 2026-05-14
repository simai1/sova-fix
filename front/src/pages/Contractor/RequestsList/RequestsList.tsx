import { useEffect, useMemo, useRef, useState } from 'react';

import {
  RequestDto,
  useGetMyObjectsQuery,
  useGetMyRequestsQuery,
  useGetStatusesQuery,
  useGetUrgenciesQuery,
} from '@/API/rtkQuery/lk.api';
import FilterModal, { LkFilterValue } from '@/components/Lk/FilterModal';
import { countActiveFilters } from '@/components/Lk/filterUtils';
import LkEmpty from '@/components/Lk/LkEmpty';
import LkErrorBanner from '@/components/Lk/LkErrorBanner';
import LkListItem from '@/components/Lk/LkListItem';
import LkSearchInput from '@/components/Lk/LkSearchInput';
import LkSelect from '@/components/Lk/LkSelect';
import LkSkeleton from '@/components/Lk/LkSkeleton';
import LkSpinner from '@/components/Lk/LkSpinner';
import { SORT_OPTIONS } from '@/components/Lk/sortOptions';
import { useSavedFilters } from '@/hooks/useSavedFilters';
import { deriveUnitsFromObjects } from '@/utils/lkUnits';

const PAGE_LIMIT = 20;

// Восстанавливаем индекс сортировки по совпадению (sort,order). Если
// в сохранёнке оказалась пара, которой больше нет в SORT_OPTIONS (например,
// после правки списка) — возвращаем 0 («Сначала новые»), чтобы не сломать
// индекс-доступ.
const findSortIdx = (sort: string, order: 'asc' | 'desc'): number => {
  const idx = SORT_OPTIONS.findIndex((o) => o.sort === sort && o.order === order);
  return idx >= 0 ? idx : 0;
};

const ContractorRequestsList = (): JSX.Element => {
  const { stored, save, clear } = useSavedFilters('contractor-requests');

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LkFilterValue>(() => stored?.filters ?? {});
  const [sortIdx, setSortIdx] = useState<number>(() =>
    stored ? findSortIdx(stored.sort.sort, stored.sort.order) : 0,
  );
  const [filterOpen, setFilterOpen] = useState(false);
  // Не сохраняем в useSavedFilters: это контекстный режим, не «настройка».
  const [mineOnly, setMineOnly] = useState<boolean>(false);
  const [items, setItems] = useState<RequestDto[]>([]);

  const sort = SORT_OPTIONS[sortIdx]!;

  const { data, isFetching, isError } = useGetMyRequestsQuery({
    role: 'contractor',
    page,
    limit: PAGE_LIMIT,
    search: search || undefined,
    unitId: filters.unitId,
    objectId: filters.objectId,
    statusId: filters.statusId,
    urgencyId: filters.urgencyId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    sort: sort.sort,
    order: sort.order,
    mine: mineOnly || undefined,
  });

  const { data: statuses = [] } = useGetStatusesQuery();
  const { data: urgencies = [] } = useGetUrgenciesQuery();
  const { data: objects = [] } = useGetMyObjectsQuery();

  const units = useMemo(() => deriveUnitsFromObjects(objects), [objects]);

  // Аккумулируем страницы; при смене search/filters/sort — сброс
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [search, filters, sortIdx, mineOnly]);

  useEffect(() => {
    if (!data) return;
    setItems((prev) => {
      if (data.page === 1) return data.items;
      // Дедуп по id — на случай гонок инвалидации/реконнекта WS
      const map = new Map<string, RequestDto>();
      [...prev, ...data.items].forEach((r) => map.set(r.id, r));
      return Array.from(map.values());
    });
  }, [data]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => {
      const [entry] = entries;
      if (entry?.isIntersecting && data && items.length < data.total && !isFetching) {
        setPage((p) => p + 1);
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [data, items.length, isFetching]);

  const total = data?.total ?? 0;
  const activeCount = countActiveFilters(filters);
  const noResults = !isFetching && items.length === 0;

  // Пишем в localStorage только из user-events (apply/reset/смена сортировки),
  // не из useEffect на каждом render'е. Иначе initial-восстановленный state
  // тут же пересохраняется и savedAt дрейфует на каждый mount без действий
  // юзера — лишний шум в storage и непрозрачное поведение.
  const handleApplyFilters = (next: LkFilterValue): void => {
    setFilters(next);
    if (countActiveFilters(next) === 0) {
      // Полный сброс — снимаем всё. sort возвращаем к дефолту.
      setSortIdx(0);
      clear();
    } else {
      save({ filters: next, sort: { sort: sort.sort, order: sort.order } });
    }
  };

  const handleSortChange = (idxStr: string): void => {
    const idx = Number(idxStr);
    setSortIdx(idx);
    const nextSort = SORT_OPTIONS[idx];
    if (!nextSort) return;
    // Сохраняем сортировку, только если есть активные фильтры или сортировка
    // отличается от дефолтной — иначе сохранять нечего, мусорить storage не
    // нужно.
    if (countActiveFilters(filters) > 0 || idx !== 0) {
      save({ filters, sort: { sort: nextSort.sort, order: nextSort.order } });
    } else {
      clear();
    }
  };

  return (
    <>
      <div className="lk-row-gap-2" style={{ alignItems: 'center' }}>
        <LkSearchInput value={search} onChange={setSearch} placeholder="Поиск по заявкам" />
      </div>
      <div className="lk-toolbar">
        <button type="button" onClick={() => setFilterOpen(true)}>
          Фильтры
          {activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
        <button
          type="button"
          className="lk-toolbar__toggle"
          aria-pressed={mineOnly}
          onClick={() => setMineOnly((v) => !v)}
        >
          Мои
        </button>
        <LkSelect
          size="sm"
          style={{ flex: 1 }}
          value={String(sortIdx)}
          onChange={handleSortChange}
          options={SORT_OPTIONS.map((opt, idx) => ({ value: String(idx), label: opt.label }))}
          aria-label="Сортировка"
        />
      </div>

      {isError ? <LkErrorBanner text="Не удалось загрузить заявки" /> : null}

      {items.length > 0 ? (
        <div className="lk-card-grid">
          {items.map((req, i) => (
            <LkListItem
              key={req.id}
              request={req}
              to={`/contractor/requests/${req.id}`}
              index={i < PAGE_LIMIT ? i : undefined}
            />
          ))}
        </div>
      ) : null}

      {noResults && !isError ? (
        <LkEmpty
          icon={
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M22 12h-6l-2 3h-4l-2-3H2" />
              <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          }
          title="Пока нет назначенных заявок"
          text="Заявки появятся, когда менеджер назначит их вам."
        />
      ) : null}

      {isFetching && items.length === 0 ? <LkSkeleton variant="list" count={5} /> : null}
      {isFetching && items.length > 0 ? <LkSpinner /> : null}

      <div ref={sentinelRef} style={{ height: 1 }} />

      {data && items.length >= total && total > 0 ? (
        <div className="lk-card__muted" style={{ textAlign: 'center', padding: 12 }}>
          Загружены все заявки
        </div>
      ) : null}

      <FilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        value={filters}
        onApply={handleApplyFilters}
        options={{ objects, statuses, urgencies, units }}
      />
    </>
  );
};

export default ContractorRequestsList;
