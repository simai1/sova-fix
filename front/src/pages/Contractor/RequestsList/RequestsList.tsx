import { useEffect, useMemo, useRef, useState } from 'react';

import {
  RequestDto,
  useGetMyObjectsQuery,
  useGetMyRequestsQuery,
  useGetStatusesQuery,
  useGetUrgenciesQuery,
} from '@/API/rtkQuery/lk.api';
import FilterModal, { LkFilterValue } from '@/components/Lk/FilterModal';
import LkEmpty from '@/components/Lk/LkEmpty';
import LkListItem from '@/components/Lk/LkListItem';
import LkSearchInput from '@/components/Lk/LkSearchInput';
import LkSelect from '@/components/Lk/LkSelect';
import LkSpinner from '@/components/Lk/LkSpinner';
import { SORT_OPTIONS } from '@/components/Lk/sortOptions';
import { deriveUnitsFromObjects } from '@/utils/lkUnits';

const PAGE_LIMIT = 20;

const ContractorRequestsList = (): JSX.Element => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LkFilterValue>({});
  const [sortIdx, setSortIdx] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
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
  });

  const { data: statuses = [] } = useGetStatusesQuery();
  const { data: urgencies = [] } = useGetUrgenciesQuery();
  const { data: objects = [] } = useGetMyObjectsQuery();

  const units = useMemo(() => deriveUnitsFromObjects(objects), [objects]);

  // Аккумулируем страницы; при смене search/filters/sort — сброс
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [search, filters, sortIdx]);

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
  const noResults = !isFetching && items.length === 0;

  return (
    <>
      <div className="lk-row-gap-2" style={{ alignItems: 'center' }}>
        <LkSearchInput value={search} onChange={setSearch} placeholder="Поиск по заявкам" />
      </div>
      <div className="lk-toolbar">
        <button type="button" onClick={() => setFilterOpen(true)}>
          Фильтры
          {Object.keys(filters).length > 0 ? ` (${Object.keys(filters).length})` : ''}
        </button>
        <LkSelect
          size="sm"
          style={{ flex: 1 }}
          value={String(sortIdx)}
          onChange={(v) => setSortIdx(Number(v))}
          options={SORT_OPTIONS.map((opt, idx) => ({ value: String(idx), label: opt.label }))}
          aria-label="Сортировка"
        />
      </div>

      {isError ? <LkEmpty text="Не удалось загрузить заявки" /> : null}

      {items.length > 0 ? (
        <div className="lk-card-grid">
          {items.map((req) => (
            <LkListItem key={req.id} request={req} to={`/contractor/requests/${req.id}`} />
          ))}
        </div>
      ) : null}

      {noResults && !isError ? <LkEmpty text="У вас пока нет заявок" /> : null}

      {isFetching ? <LkSpinner /> : null}

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
        onApply={setFilters}
        options={{ objects, statuses, urgencies, units }}
      />
    </>
  );
};

export default ContractorRequestsList;
