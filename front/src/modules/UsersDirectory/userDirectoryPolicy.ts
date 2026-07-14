import { normalizeUserId } from './userDirectoryActions';
import { ROLE_LABELS_BY_ID, WEB_ROLE_IDS, type WebRoleName } from '../../constants/roles.constant';

type UserDirectoryRoleId = (typeof WEB_ROLE_IDS)[keyof typeof WEB_ROLE_IDS];

type UserDirectoryTarget = {
  id: string | null;
  role: number;
};

type UserDirectorySourceRow = {
  id?: unknown;
  isConfirmed?: unknown;
  login?: unknown;
  name?: unknown;
  role?: unknown;
  tgUserId?: unknown;
  [key: string]: unknown;
};

type UserDirectoryPolicy = {
  canActivate: boolean;
  canCreateOrDelete: boolean;
  roleOptions: readonly UserDirectoryRoleId[];
};

type UserDirectoryRowPolicy = {
  canAssignObjects: boolean;
  canChangeRole: boolean;
};

const ADMIN_ROLE_OPTIONS = [
  WEB_ROLE_IDS.ADMIN,
  WEB_ROLE_IDS.CUSTOMER,
  WEB_ROLE_IDS.CONTRACTOR,
  WEB_ROLE_IDS.OBSERVER,
  WEB_ROLE_IDS.MANAGER,
] as const;

const MANAGER_ROLE_OPTIONS = [
  WEB_ROLE_IDS.ADMIN,
  WEB_ROLE_IDS.CUSTOMER,
  WEB_ROLE_IDS.CONTRACTOR,
  WEB_ROLE_IDS.OBSERVER,
] as const;

const NO_ROLE_OPTIONS: readonly UserDirectoryRoleId[] = [];
const ADMIN_OBJECT_TARGETS = new Set<number>([
  WEB_ROLE_IDS.CUSTOMER,
  WEB_ROLE_IDS.CONTRACTOR,
  WEB_ROLE_IDS.MANAGER,
]);
const MANAGER_OBJECT_TARGETS = new Set<number>([WEB_ROLE_IDS.CUSTOMER, WEB_ROLE_IDS.CONTRACTOR]);

export const getUserDirectoryPolicy = (actorRole: WebRoleName | null): UserDirectoryPolicy => {
  if (actorRole === 'ADMIN') {
    return {
      canActivate: true,
      canCreateOrDelete: true,
      roleOptions: ADMIN_ROLE_OPTIONS,
    };
  }
  if (actorRole === 'MANAGER') {
    return {
      canActivate: false,
      canCreateOrDelete: false,
      roleOptions: MANAGER_ROLE_OPTIONS,
    };
  }
  return {
    canActivate: false,
    canCreateOrDelete: false,
    roleOptions: NO_ROLE_OPTIONS,
  };
};

export const getUserDirectoryRowPolicy = (
  actorRole: WebRoleName | null,
  actorUserId: string | null,
  target: UserDirectoryTarget,
): UserDirectoryRowPolicy => {
  const canManageUsers = actorRole === 'ADMIN' || actorRole === 'MANAGER';
  const canAssignObjects =
    (actorRole === 'ADMIN' && ADMIN_OBJECT_TARGETS.has(target.role)) ||
    (actorRole === 'MANAGER' && MANAGER_OBJECT_TARGETS.has(target.role));

  return {
    canAssignObjects,
    canChangeRole:
      canManageUsers && actorUserId !== null && target.id !== null && actorUserId !== target.id,
  };
};

export const formatUserDirectoryRole = (role: number): string =>
  ROLE_LABELS_BY_ID[role as UserDirectoryRoleId] ?? '___';

export const normalizeAllowedRoleId = (
  value: unknown,
  allowedRoleIds: readonly number[],
): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = Number(value);
  return Number.isFinite(normalized) &&
    Number.isInteger(normalized) &&
    allowedRoleIds.includes(normalized)
    ? normalized
    : null;
};

export const buildUserDirectoryRows = (
  data: readonly UserDirectorySourceRow[],
  actorRole: WebRoleName | null,
  actorUserId: string | null,
): Array<UserDirectorySourceRow & Record<string, unknown>> =>
  data.map((item) => {
    const id = normalizeUserId(item.id);
    const roleId = Number(item.role);
    const rowPolicy = getUserDirectoryRowPolicy(actorRole, actorUserId, { id, role: roleId });
    return {
      ...item,
      id: id ?? '___',
      isConfirmed: item.isConfirmed === true ? 'Активирован' : 'Не активирован',
      login: item.login || '___',
      tgUserId: item.tgUserId || '___',
      name: item.name || '___',
      role: formatUserDirectoryRole(roleId),
      roleId,
      roleEditable: rowPolicy.canChangeRole,
      accessButton: rowPolicy.canAssignObjects ? 'button' : null,
    };
  });
