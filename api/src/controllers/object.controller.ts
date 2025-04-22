import catchAsync from '../utils/catchAsync';
import objectService from '../services/object.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = catchAsync(async (req, res) => {
    const { tgUserId } = req.query;
    
    // Если передан tgUserId, получаем только объекты этого пользователя
    if (tgUserId) {
        const userObjects = await objectService.getUserObjects(tgUserId as string);
        return res.json(userObjects);
    }
    
    // Иначе получаем все объекты
    const objects = await objectService.getAllObjects();
    res.json(objects);
});

const create = catchAsync(async (req, res) => {
    const { name, unitId, city, legalEntityId } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing unitId');
    if (!city) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing city');
    const object = await objectService.createObject(name, unitId, city, legalEntityId);
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
    const { name, unitId, city, legalEntityId } = req.body;
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await objectService.updateObject(objectId, name, unitId, city, legalEntityId);
    res.json({ status: 'OK' });
});

export default {
    getAll,
    create,
    getOne,
    destroy,
    update,
};
