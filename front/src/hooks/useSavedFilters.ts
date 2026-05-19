import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { LkFilterValue } from '@/components/Lk/FilterModal';
import { getUserData } from '@/utils/auth';

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

export const SAVED_FILTERS_KEY_PREFIX = KEY_PREFIX;

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

  const [stored] = useState<SavedFiltersState | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as unknown;
      const userId = readCurrentUserId();
      if (!userId) {
        window.localStorage.removeItem(key);
        return null;
      }
      if (!isValidPayload(parsed, userId)) {
        window.localStorage.removeItem(key);
        return null;
      }
      return { filters: parsed.filters, sort: parsed.sort };
    } catch {
      try {
        window.localStorage.removeItem(key);
      } catch {}
      return null;
    }
  });

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
      } catch {}
    },
    [key],
  );

  const clear = useCallback((): void => {
    try {
      window.localStorage.removeItem(key);
    } catch {}
  }, [key]);

  return { stored, save, clear };
};
