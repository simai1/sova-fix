export type WebRoleName = 'ADMIN' | 'CUSTOMER' | 'CONTRACTOR' | 'OBSERVER' | 'MANAGER';

export const WEB_ROLE_IDS = {
  ADMIN: 2,
  CUSTOMER: 3,
  CONTRACTOR: 4,
  OBSERVER: 5,
  MANAGER: 6,
} as const;

export const ROLE_LABELS_BY_NAME: Record<WebRoleName, string> = {
  ADMIN: 'Администратор',
  CUSTOMER: 'Заказчик',
  CONTRACTOR: 'Исполнитель',
  OBSERVER: 'Наблюдатель',
  MANAGER: 'Менеджер',
};

type WebRoleId = (typeof WEB_ROLE_IDS)[WebRoleName];

export const ROLE_LABELS_BY_ID: Record<WebRoleId, string> = {
  [WEB_ROLE_IDS.ADMIN]: ROLE_LABELS_BY_NAME.ADMIN,
  [WEB_ROLE_IDS.CUSTOMER]: ROLE_LABELS_BY_NAME.CUSTOMER,
  [WEB_ROLE_IDS.CONTRACTOR]: ROLE_LABELS_BY_NAME.CONTRACTOR,
  [WEB_ROLE_IDS.OBSERVER]: ROLE_LABELS_BY_NAME.OBSERVER,
  [WEB_ROLE_IDS.MANAGER]: ROLE_LABELS_BY_NAME.MANAGER,
};

const WEB_ROLE_NAMES = new Set<string>(Object.keys(WEB_ROLE_IDS));

const isWebRoleName = (role: unknown): role is WebRoleName =>
  typeof role === 'string' && WEB_ROLE_NAMES.has(role);

export const isAdminUiRole = (role?: string | null): boolean =>
  role === 'ADMIN' || role === 'MANAGER';

export const isBackOfficeUiRole = (role?: string | null): boolean =>
  isAdminUiRole(role) || role === 'OBSERVER';

export const isAdminOnlyRole = (role?: string | null): boolean => role === 'ADMIN';

export const getStoredRole = (): WebRoleName | null => {
  try {
    const raw = sessionStorage.getItem('userData');
    if (!raw) return null;
    const data = JSON.parse(raw) as { user?: { role?: unknown } } | null;
    return isWebRoleName(data?.user?.role) ? data.user.role : null;
  } catch {
    return null;
  }
};
