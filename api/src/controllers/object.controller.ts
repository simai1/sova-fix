import catchAsync from '../utils/catchAsync';
import objectService from '../services/object.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = catchAsync(async (req, res) => {
    const objects = await objectService.getAllObjects();
    res.json(objects);
});

const create = catchAsync(async (req, res) => {
    const { name, unitId } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing unitId');
    const object = await objectService.createObject(name, unitId);
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
    const { name, unitId } = req.body;
    if (!objectId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await objectService.updateObject(objectId, name, unitId);
    res.json({ status: 'OK' });
});

export default {
    getAll,
    create,
    getOne,
    destroy,
    update,
};
