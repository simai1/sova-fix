import { useSyncExternalStore } from 'react';

import { WEB_ROLE_IDS, type WebRoleName } from '@/constants/roles.constant';
import { getAuthSessionSnapshot, subscribeAuthSession } from '@/utils/auth';

const getServerSnapshot = (): null => null;

const parseRole = (snapshot: string | null): WebRoleName | null => {
  if (!snapshot) return null;
  try {
    const role = (JSON.parse(snapshot) as { user?: { role?: unknown } })?.user?.role;
    return typeof role === 'string' && Object.prototype.hasOwnProperty.call(WEB_ROLE_IDS, role)
      ? (role as WebRoleName)
      : null;
  } catch {
    return null;
  }
};

export const useStoredRole = (): WebRoleName | null => {
  const snapshot = useSyncExternalStore(
    subscribeAuthSession,
    getAuthSessionSnapshot,
    getServerSnapshot,
  );
  return parseRole(snapshot);
};
