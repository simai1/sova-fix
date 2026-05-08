import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  RequestDto,
  useGetMyObjectsQuery,
  useGetMyRequestsQuery,
  useGetStatusesQuery,
  useGetUrgenciesQuery,
} from '@/API/rtkQuery/lk.api';
import FilterModal, { LkFilterValue } from '@/components/Lk/FilterModal';
import LkEmpty from '@/components/Lk/LkEmpty';
import LkErrorBanner from '@/components/Lk/LkErrorBanner';
import LkListItem from '@/components/Lk/LkListItem';
import LkSearchInput from '@/components/Lk/LkSearchInput';
import LkSelect from '@/components/Lk/LkSelect';
import LkSkeleton from '@/components/Lk/LkSkeleton';
import LkSpinner from '@/components/Lk/LkSpinner';
import { SORT_OPTIONS } from '@/components/Lk/sortOptions';
import { deriveUnitsFromObjects } from '@/utils/lkUnits';

const PAGE_LIMIT = 20;

const countActiveFilters = (f: LkFilterValue): number => {
  let count = 0;
  if (f.unitId) count++;
  if (f.objectId) count++;
  if (f.statusId) count++;
  if (f.urgencyId) count++;
  // dateFrom + dateTo — один фильтр «период»
  if (f.dateFrom || f.dateTo) count++;
  return count;
};

const CustomerRequestsList = (): JSX.Element => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<LkFilterValue>({});
  const [sortIdx, setSortIdx] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [items, setItems] = useState<RequestDto[]>([]);

  const sort = SORT_OPTIONS[sortIdx]!;

  const { data, isFetching, isError } = useGetMyRequestsQuery({
    role: 'customer',
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

  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [search, filters, sortIdx]);

  useEffect(() => {
    if (!data) return;
    setItems((prev) => {
      if (data.page === 1) return data.items;
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
          {countActiveFilters(filters) > 0 ? ` (${countActiveFilters(filters)})` : ''}
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

      {isError ? <LkErrorBanner text="Не удалось загрузить заявки" /> : null}

      {items.length > 0 ? (
        <div className="lk-card-grid">
          {items.map((req, i) => (
            <LkListItem
              key={req.id}
              request={req}
              to={`/customer/requests/${req.id}`}
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
          title="У вас пока нет заявок"
          text="Создайте первую заявку, чтобы начать работу."
          action={{
            label: 'Создать заявку',
            onClick: () => navigate('/customer/requests/new'),
            variant: 'accent',
          }}
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
        onApply={setFilters}
        options={{ objects, statuses, urgencies, units }}
      />
    </>
  );
};

export default CustomerRequestsList;
