import catchAsync from '../utils/catchAsync';
import objectService from '../services/object.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import User from '../models/user';
import roles from '../config/roles';

const getAll = catchAsync(async (req, res) => {
    const { tgUserId, unitId, scope } = req.query;
    const actor = req.actor!;
    const normalizedUnitId = unitId ? (unitId as string) : null;

    if (actor.kind === 'bot') {
        if (!tgUserId) return res.json(await objectService.getAllObjects(normalizedUnitId));
        const tgUser = await User.findOne({ where: { tgManagerId: tgUserId } });
        if (!tgUser) throw new ApiError(httpStatus.NOT_FOUND, 'TgUser not found');
        if (tgUser.role === roles.ADMIN) {
            const objects = await objectService.getAllObjects(normalizedUnitId);
            return res.json(objects);
        }
        const userObjects = await objectService.getUserObjects(tgUserId as string, normalizedUnitId ?? undefined);
        return res.json(userObjects);
    }

    if (scope === 'requests') {
        if (actor.role === roles.ADMIN) return res.json(await objectService.getAllObjects(normalizedUnitId));
        if (actor.role === roles.MANAGER)
            return res.json(await objectService.getScopeObjects(req.requestScope!, normalizedUnitId));
        if ([roles.CUSTOMER, roles.CONTRACTOR].includes(actor.role))
            return res.json(await objectService.getWebUserObjects(actor.userId, normalizedUnitId));
        throw new ApiError(httpStatus.FORBIDDEN, 'Доступ запрещён');
    }

    if (![roles.ADMIN, roles.MANAGER].includes(actor.role)) throw new ApiError(httpStatus.FORBIDDEN, 'Доступ запрещён');
    return res.json(await objectService.getAllObjects(normalizedUnitId));
});

const create = catchAsync(async (req, res) => {
    const { name, unitId, city, legalEntityId, budgetPlan } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing unitId');
    if (!city) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing city');
    const object = await objectService.createObject(name, unitId, city, legalEntityId, budgetPlan);
    res.json(object);
});

const getOne = catchAsync(async (req, res) => {
    const { objectId } = req.params;
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const object = await objectService.getOneObject(objectId);
    res.json(object);
});

const destroy = catchAsync(async (req, res) => {
    const { objectId } = req.params;
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await objectService.destroyObject(objectId);
    res.json({ status: 'OK' });
});

const update = catchAsync(async (req, res) => {
    const { objectId } = req.params;
    const { name, unitId, city, legalEntityId, budgetPlan } = req.body;
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await objectService.updateObject(objectId, name, unitId, city, legalEntityId, budgetPlan);
    res.json({ status: 'OK' });
});

export default {
    getAll,
    create,
    getOne,
    destroy,
    update,
};
