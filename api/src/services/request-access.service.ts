import httpStatus from 'http-status';
import { Op, WhereOptions } from 'sequelize';
import roles from '../config/roles';
import RepairRequest from '../models/repairRequest';
import User from '../models/user';
import UserObject from '../models/userObject';
import { AuthActor } from '../types/auth';
import ApiError from '../utils/ApiError';

export type RequestScope = { kind: 'all' } | { kind: 'objects'; userId: string; objectIds: string[] };

const forbidden = (): ApiError => new ApiError(httpStatus.FORBIDDEN, 'У вас нет доступа к этой заявке');

const notFound = (): ApiError => new ApiError(httpStatus.NOT_FOUND, 'Заявка не найдена');

const uniqueRequestIds = (requestIds: string[]): string[] =>
    Array.from(new Set(requestIds.map(requestId => requestId.trim().toLowerCase())));

export const loadRequestScope = async (actor: AuthActor): Promise<RequestScope> => {
    if (actor.kind === 'bot' || actor.role !== roles.MANAGER) return { kind: 'all' };

    const assignments = await UserObject.findAll({
        attributes: ['objectId'],
        where: { userId: actor.userId },
        raw: true,
    });

    return {
        kind: 'objects',
        userId: actor.userId,
        objectIds: Array.from(new Set(assignments.map(({ objectId }) => objectId))),
    };
};

export const scopeWhere = (scope: RequestScope, where: WhereOptions = {}): WhereOptions =>
    scope.kind === 'all' ? where : { [Op.and]: [where, { objectId: { [Op.in]: scope.objectIds } }] };

export const assertObjectAccess = (objectId: string | null | undefined, scope: RequestScope): void => {
    if (scope.kind === 'all') return;
    if (!objectId || !scope.objectIds.includes(objectId)) throw forbidden();
};

export const loadAccessibleRequest = async (requestId: string, scope: RequestScope): Promise<RepairRequest> => {
    const repairRequest = await RepairRequest.findByPk(requestId);
    if (!repairRequest) throw notFound();
    assertObjectAccess(repairRequest.objectId, scope);
    return repairRequest;
};

export const loadAccessibleRequests = async (requestIds: string[], scope: RequestScope): Promise<RepairRequest[]> => {
    const uniqueIds = uniqueRequestIds(requestIds);
    if (uniqueIds.length === 0) return [];

    const repairRequests = await RepairRequest.findAll({
        where: { id: { [Op.in]: uniqueIds } },
    });
    const requestsById = new Map(repairRequests.map(repairRequest => [repairRequest.id.toLowerCase(), repairRequest]));
    if (requestsById.size !== uniqueIds.length) throw notFound();

    const orderedRequests = uniqueIds.map(requestId => requestsById.get(requestId) as RepairRequest);
    orderedRequests.forEach(repairRequest => assertObjectAccess(repairRequest.objectId, scope));
    return orderedRequests;
};

export const getAdministrativeAudienceUserIds = async (objectId?: string): Promise<string[]> => {
    const users = await User.findAll({
        attributes: ['id', 'role'],
        where: {
            role: { [Op.in]: [roles.ADMIN, roles.MANAGER] },
            isActivated: true,
        },
    });
    if (objectId === undefined) return Array.from(new Set(users.map(user => user.id)));

    const adminIds = users.filter(user => user.role === roles.ADMIN).map(user => user.id);
    const managerIds = users.filter(user => user.role === roles.MANAGER).map(user => user.id);
    const assignments = await UserObject.findAll({
        attributes: ['userId'],
        where: {
            objectId,
            userId: { [Op.in]: managerIds },
        },
        raw: true,
    });

    return Array.from(new Set([...adminIds, ...assignments.map(({ userId }) => userId)]));
};
