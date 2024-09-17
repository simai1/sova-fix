import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import unitService from '../services/unit.service';

const getAll = catchAsync(async (req, res) => {
    const units = await unitService.getAllUnits();
    res.json(units);
});

const create = catchAsync(async (req, res) => {
    const { name, count, description } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!count) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing count');
    const unit = await unitService.createUnit(name, count, description);
    res.json(unit);
});

const getOne = catchAsync(async (req, res) => {
    const { unitId } = req.params;
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const unit = await unitService.getOneUnit(unitId);
    res.json(unit);
});

const destroy = catchAsync(async (req, res) => {
    const { unitId } = req.params;
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await unitService.destroyUnit(unitId);
    res.json({ status: 'OK' });
});

const update = catchAsync(async (req, res) => {
    const { unitId } = req.params;
    const { name, count, description } = req.body;
    if (!unitId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const unit = await unitService.updateUnit(unitId, name, count, description);
    res.json(unit);
});

export default {
    getAll,
    create,
    getOne,
    destroy,
    update,
};
