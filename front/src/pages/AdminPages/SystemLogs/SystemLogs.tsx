import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';

import styles from './SystemLogs.module.scss';
import {
  type SystemLogItem,
  type SystemLogLevel,
  useLazyGetSystemLogsQuery,
} from '../../../API/rtkQuery/admin.api';

type LevelOption = SystemLogLevel | 'all';

// Преобразуем строку из <input type="date"> (YYYY-MM-DD) в ISO с границами дня
// в МСК. Это админка — пользователь думает в локальной таймзоне, но БД хранит
// UTC; чтобы фильтр «from=2026-05-08» включал записи с 00:00 МСК того же дня,
// прибавляем смещение Europe/Moscow вручную (UTC+3, без переходов на летнее).
const MOSCOW_OFFSET_HOURS = 3;

const dayBoundaryToISO = (value: string, end: boolean): string | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  // 00:00 МСК (или 23:59:59.999 МСК) -> UTC = МСК - 3ч
  const hours = end ? 23 - MOSCOW_OFFSET_HOURS : 0 - MOSCOW_OFFSET_HOURS;
  const minutes = end ? 59 : 0;
  const seconds = end ? 59 : 0;
  const ms = end ? 999 : 0;
  // Date.UTC с допустимыми отрицательными часами автоматически нормализуется
  // (Date.UTC(2026, 4, 8, -3) = 2026-05-07T21:00:00Z).
  const ts = Date.UTC(y, m - 1, d, hours, minutes, seconds, ms);
  return new Date(ts).toISOString();
};

const formatMoscow = (iso: string) => {
  // Europe/Moscow без переходов на летнее. Intl справится корректно.
  const d = new Date(iso);
  const date = d.toLocaleDateString('ru-RU', {
    timeZone: 'Europe/Moscow',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const time = d.toLocaleTimeString('ru-RU', {
    timeZone: 'Europe/Moscow',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  return `${date} ${time}`;
};

const levelChipClass = (level: SystemLogLevel) => {
  if (level === 'error') return styles.chipError;
  if (level === 'warn') return styles.chipWarn;
  return styles.chipInfo;
};

const levelLabel = (level: SystemLogLevel) => {
  if (level === 'error') return 'Ошибка';
  if (level === 'warn') return 'Предупр.';
  return 'Инфо';
};

function SystemLogs() {
  const role = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem('userData') || 'null')?.user?.role;
    } catch {
      return null;
    }
  }, []);

  const [level, setLevel] = useState<LevelOption>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [items, setItems] = useState<SystemLogItem[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<SystemLogItem | null>(null);

  const [trigger, { isFetching, isError }] = useLazyGetSystemLogsQuery();

  // Debounce для search-input — 300 мс, как в ТЗ.
  const searchTimer = useRef<number | null>(null);
  useEffect(() => {
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [search]);

  // Загрузка первой страницы при изменении фильтров.
  useEffect(() => {
    if (role !== 'ADMIN') return;
    let cancelled = false;
    const load = async () => {
      const fromIso = dayBoundaryToISO(from, false);
      const toIso = dayBoundaryToISO(to, true);
      const result = await trigger({
        level: level === 'all' ? undefined : level,
        from: fromIso,
        to: toIso,
        q: debouncedSearch || undefined,
        limit: 50,
      })
        .unwrap()
        .catch(() => null);
      if (cancelled) return;
      if (result) {
        setItems(result.items);
        setCursor(result.nextCursor ?? undefined);
        setHasMore(result.hasMore);
      } else {
        setItems([]);
        setCursor(undefined);
        setHasMore(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [role, level, from, to, debouncedSearch, trigger]);

  if (role !== 'ADMIN') return <Navigate to="/" replace />;

  const onLoadMore = async () => {
    if (!cursor) return;
    const fromIso = dayBoundaryToISO(from, false);
    const toIso = dayBoundaryToISO(to, true);
    const result = await trigger({
      level: level === 'all' ? undefined : level,
      from: fromIso,
      to: toIso,
      q: debouncedSearch || undefined,
      limit: 50,
      cursor,
    })
      .unwrap()
      .catch(() => null);
    if (result) {
      setItems((prev) => [...prev, ...result.items]);
      setCursor(result.nextCursor ?? undefined);
      setHasMore(result.hasMore);
    }
  };

  const onReset = () => {
    setLevel('all');
    setFrom('');
    setTo('');
    setSearch('');
  };

  return (
    <div className={styles.wrap}>
      <h2>Системные логи</h2>

      <div className={styles.toolbar}>
        <div className={styles.field}>
          <label htmlFor="syslog-level">Уровень</label>
          <select
            id="syslog-level"
            value={level}
            onChange={(e) => setLevel(e.target.value as LevelOption)}
          >
            <option value="all">Все</option>
            <option value="info">Инфо</option>
            <option value="warn">Предупреждение</option>
            <option value="error">Ошибка</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="syslog-from">С даты</label>
          <input
            id="syslog-from"
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="syslog-to">По дату</label>
          <input id="syslog-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className={`${styles.field} ${styles.fieldGrow}`}>
          <label htmlFor="syslog-search">Поиск по сообщению</label>
          <input
            id="syslog-search"
            type="text"
            placeholder="например: validation error"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={onReset} disabled={isFetching}>
            Сбросить
          </button>
        </div>
      </div>

      {isError && (
        <div className={styles.errorBanner}>
          Не удалось загрузить логи. Попробуйте обновить страницу.
        </div>
      )}

      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.colDate}>Дата (МСК)</th>
            <th className={styles.colLevel}>Уровень</th>
            <th className={styles.colService}>Сервис</th>
            <th className={styles.colMessage}>Сообщение</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !isFetching && (
            <tr>
              <td colSpan={4} className={styles.empty}>
                Логи не найдены
              </td>
            </tr>
          )}
          {items.map((it) => (
            <tr key={it.id} onClick={() => setSelected(it)} title="Открыть подробности">
              <td className={styles.colDate}>{formatMoscow(it.createdAt)}</td>
              <td className={styles.colLevel}>
                <span className={`${styles.chip} ${levelChipClass(it.level)}`}>
                  {levelLabel(it.level)}
                </span>
              </td>
              <td className={styles.colService}>{it.service}</td>
              <td className={styles.colMessage}>
                <div className={styles.message} title={it.message}>
                  {it.message}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isFetching && <div className={styles.spinner}>Загрузка...</div>}

      {hasMore && !isFetching && (
        <div className={styles.loadMore}>
          <button type="button" onClick={onLoadMore} disabled={isFetching}>
            Загрузить ещё
          </button>
        </div>
      )}

      {selected && (
        <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Запись лога</h3>
              <button
                type="button"
                className={styles.closeBtn}
                aria-label="Закрыть"
                onClick={() => setSelected(null)}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}>
                <strong>Дата:</strong>
                <span>{formatMoscow(selected.createdAt)} (МСК)</span>
              </div>
              <div className={styles.modalRow}>
                <strong>Уровень:</strong>
                <span>
                  <span className={`${styles.chip} ${levelChipClass(selected.level)}`}>
                    {levelLabel(selected.level)}
                  </span>
                </span>
              </div>
              <div className={styles.modalRow}>
                <strong>Сервис:</strong>
                <span>{selected.service}</span>
              </div>
              <div className={styles.modalRow}>
                <strong>ID:</strong>
                <span>{selected.id}</span>
              </div>
              <div>
                <strong>Сообщение:</strong>
                <div className={styles.fullMessage}>{selected.message}</div>
              </div>
              {selected.meta && Object.keys(selected.meta).length > 0 && (
                <div className={styles.metaBlock}>
                  <strong>Дополнительные поля:</strong>
                  <pre>{JSON.stringify(selected.meta, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemLogs;
