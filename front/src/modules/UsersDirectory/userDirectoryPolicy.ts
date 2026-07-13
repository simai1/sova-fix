import { ROLE_LABELS_BY_ID, WEB_ROLE_IDS, type WebRoleName } from '../../constants/roles.constant';

type UserDirectoryRoleId = (typeof WEB_ROLE_IDS)[keyof typeof WEB_ROLE_IDS];

type UserDirectoryTarget = {
  id: string;
  role: number;
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
      canActivate: true,
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
    canChangeRole: canManageUsers && actorUserId !== null && actorUserId !== target.id,
  };
};

export const formatUserDirectoryRole = (role: number): string =>
  ROLE_LABELS_BY_ID[role as UserDirectoryRoleId] ?? '___';
