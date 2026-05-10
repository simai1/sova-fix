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

// Backend пишет в meta поля контекста запроса. Тип не строгий — admin.api.ts
// объявил meta как Record<string, unknown> | null, чтобы не ломаться при
// расширениях. Приводим только то, что используем в UI.
type LogMeta = {
  userId?: string | null;
  login?: string | null;
  role?: number | null;
  method?: string | null;
  path?: string | null;
  statusCode?: number | null;
  friendly?: string | null;
};

// Соответствие числовых ролей строковым меткам — дублирует api/src/config/roles.ts.
// Менеджеру так проще читать: «Менеджер» вместо «2».
const roleLabels: Record<number, string> = {
  1: 'Пользователь',
  2: 'Менеджер',
  3: 'Заказчик',
  4: 'Исполнитель',
  5: 'Наблюдатель',
};

const formatRole = (role: number | null | undefined) => {
  if (role == null) return null;
  return roleLabels[role] ? `${roleLabels[role]} (${role})` : String(role);
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
            <th className={styles.colUser}>Пользователь</th>
            <th className={styles.colRequest}>Запрос</th>
            <th className={styles.colMessage}>Сообщение</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !isFetching && (
            <tr>
              <td colSpan={5} className={styles.empty}>
                Логи не найдены
              </td>
            </tr>
          )}
          {items.map((it) => {
            const m = (it.meta || {}) as LogMeta;
            // Friendly-объяснение приоритетнее «сырого» message — это и есть
            // цель аннотаций (что значит ошибка для менеджера). Сырое
            // message со стектрейсами и SQL'ом остаётся в детальной модалке.
            const headline = m.friendly || it.message;
            const userLabel = m.login || (m.userId ? m.userId.slice(0, 8) + '…' : '—');
            const requestLabel =
              m.method && m.path ? `${m.method} ${m.path}` : m.path || m.method || '—';
            const status = m.statusCode ? ` · ${m.statusCode}` : '';
            return (
              <tr key={it.id} onClick={() => setSelected(it)} title="Открыть подробности">
                <td className={styles.colDate}>{formatMoscow(it.createdAt)}</td>
                <td className={styles.colLevel}>
                  <span className={`${styles.chip} ${levelChipClass(it.level)}`}>
                    {levelLabel(it.level)}
                  </span>
                </td>
                <td className={styles.colUser} title={m.userId || ''}>
                  {userLabel}
                </td>
                <td className={styles.colRequest}>
                  <span className={styles.requestCell} title={requestLabel}>
                    {requestLabel}
                    {status && <span className={styles.statusBadge}>{m.statusCode}</span>}
                  </span>
                </td>
                <td className={styles.colMessage}>
                  <div className={styles.message} title={headline}>
                    {headline}
                  </div>
                </td>
              </tr>
            );
          })}
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
              {(() => {
                const m = (selected.meta || {}) as LogMeta;
                return (
                  <>
                    {m.friendly && (
                      <div className={styles.friendlyBox}>
                        <strong>Что значит для менеджера:</strong>
                        <div>{m.friendly}</div>
                      </div>
                    )}
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
                      <strong>ID записи:</strong>
                      <span>{selected.id}</span>
                    </div>
                    {(m.userId || m.login || m.role != null) && (
                      <>
                        <div className={styles.modalRow}>
                          <strong>Пользователь:</strong>
                          <span>{m.login || '—'}</span>
                        </div>
                        <div className={styles.modalRow}>
                          <strong>User ID:</strong>
                          <span>{m.userId || '—'}</span>
                        </div>
                        <div className={styles.modalRow}>
                          <strong>Роль:</strong>
                          <span>{formatRole(m.role) || '—'}</span>
                        </div>
                      </>
                    )}
                    {(m.method || m.path || m.statusCode != null) && (
                      <>
                        <div className={styles.modalRow}>
                          <strong>Запрос:</strong>
                          <span>
                            {m.method ? <code>{m.method}</code> : null} {m.path || '—'}
                          </span>
                        </div>
                        <div className={styles.modalRow}>
                          <strong>HTTP-статус:</strong>
                          <span>{m.statusCode ?? '—'}</span>
                        </div>
                      </>
                    )}
                    <div>
                      <strong>Техническое сообщение:</strong>
                      <div className={styles.fullMessage}>{selected.message}</div>
                    </div>
                    {selected.meta && Object.keys(selected.meta).length > 0 && (
                      <div className={styles.metaBlock}>
                        <strong>Все meta-поля (raw):</strong>
                        <pre>{JSON.stringify(selected.meta, null, 2)}</pre>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemLogs;
