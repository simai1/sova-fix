import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { LkFilterValue } from '@/components/Lk/FilterModal';
import { getUserData } from '@/utils/auth';

// Один namespace на экран (не на user.id) — сохранённые фильтры одного юзера
// не должны утекать другому при login/logout на shared машине. Защита от
// утечки строится двумя способами:
//   1) ключ всё равно общий, но в payload пишем userId и при чтении проверяем
//      его совпадение с текущим — иначе возвращаем null;
//   2) на logout (см. useLogout) удаляем все ключи `lk:filters:*`.
// Этот «пояс и подтяжки» нужен на случай, если один из путей не сработает
// (например, юзер закрыл вкладку без logout).
export type SavedFiltersScope = 'contractor-requests' | 'customer-requests';

export type SavedSort = {
  sort: string;
  order: 'asc' | 'desc';
};

export type SavedFiltersState = {
  filters: LkFilterValue;
  sort: SavedSort;
};

type StoredPayload = SavedFiltersState & {
  userId: string;
  savedAt: number;
};

const KEY_PREFIX = 'lk:filters:';

const buildKey = (scope: SavedFiltersScope): string => `${KEY_PREFIX}${scope}`;

// Префикс публичный, чтобы useLogout мог пройтись по всем ключам без
// импорта enum-а scopes (и не плодить циклы зависимостей при появлении
// новых ЛК).
export const SAVED_FILTERS_KEY_PREFIX = KEY_PREFIX;

// Узкая валидация structural-shape (без zod/io-ts ради одного места).
// Любая невязка → null + cleanup ключа: лучше потерять старые фильтры,
// чем сохранить кривое состояние и упасть на render'е.
const isValidPayload = (raw: unknown, currentUserId: string): raw is StoredPayload => {
  if (!raw || typeof raw !== 'object') return false;
  const p = raw as Record<string, unknown>;
  if (typeof p.userId !== 'string' || p.userId !== currentUserId) return false;
  if (typeof p.savedAt !== 'number') return false;
  if (!p.filters || typeof p.filters !== 'object') return false;
  if (!p.sort || typeof p.sort !== 'object') return false;
  const s = p.sort as Record<string, unknown>;
  if (typeof s.sort !== 'string') return false;
  if (s.order !== 'asc' && s.order !== 'desc') return false;
  // filters — все поля опциональные строки. Не валидируем глубоко: бэкенд
  // всё равно валидирует statusId/urgencyId/objectId как UUID и игнорирует
  // мусор. Лишь убеждаемся, что все значения — string|undefined.
  const f = p.filters as Record<string, unknown>;
  return Object.values(f).every((v) => v === undefined || typeof v === 'string');
};

const readCurrentUserId = (): string | null => {
  const data = getUserData();
  if (!data?.user) return null;
  const id = data.user.id;
  return id === undefined || id === null ? null : String(id);
};

export type UseSavedFiltersResult = {
  stored: SavedFiltersState | null;
  save: (state: SavedFiltersState) => void;
  clear: () => void;
};

export const useSavedFilters = (scope: SavedFiltersScope): UseSavedFiltersResult => {
  const key = useMemo(() => buildKey(scope), [scope]);

  // Читаем синхронно один раз — RequestsList использует stored как initial
  // state, отдельный mount-эффект тут только опоздал бы.
  const [stored] = useState<SavedFiltersState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      const userId = readCurrentUserId();
      if (!userId) {
        // userId неизвестен (выход из ЛК?) — не отдаём ничего, и заодно
        // подчищаем чужой остаток.
        window.localStorage.removeItem(key);
        return null;
      }
      if (!isValidPayload(parsed, userId)) {
        window.localStorage.removeItem(key);
        return null;
      }
      return { filters: parsed.filters, sort: parsed.sort };
    } catch {
      // Приватный режим / порченный JSON / квота — просто игнорируем.
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
      return null;
    }
  });

  // Свежий userId на каждый save: в ходе сессии userData может (теоретически)
  // обновиться — например, при перерегистрации без перезагрузки. Берём
  // через ref, чтобы не пересоздавать save между рендерами.
  const userIdRef = useRef<string | null>(readCurrentUserId());
  useEffect(() => {
    userIdRef.current = readCurrentUserId();
  });

  const save = useCallback(
    (state: SavedFiltersState): void => {
      const userId = userIdRef.current;
      if (!userId) return;
      const payload: StoredPayload = {
        userId,
        savedAt: Date.now(),
        filters: state.filters,
        sort: state.sort,
      };
      try {
        window.localStorage.setItem(key, JSON.stringify(payload));
      } catch {
        // localStorage недоступен / переполнен — фильтры просто не сохранятся.
      }
    },
    [key],
  );

  const clear = useCallback((): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return { stored, save, clear };
};
