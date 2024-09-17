import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import legalEntityService from '../services/legalEntity.service';

const getAll = catchAsync(async (req, res) => {
    const legalEntities = await legalEntityService.getAllLegalEntities();
    res.json(legalEntities);
});

const create = catchAsync(async (req, res) => {
    const { name, legalForm, count, startCoop } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!legalForm) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing legalForm');
    if (!count) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing count');
    if (!startCoop) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing startCoop');
    const legalEntity = await legalEntityService.createLegalEntity(name, legalForm, count, startCoop);
    res.json(legalEntity);
});

const getOne = catchAsync(async (req, res) => {
    const { legalEntityId } = req.params;
    if (!legalEntityId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const legalEntity = await legalEntityService.getOneLegalEntity(legalEntityId);
    res.json(legalEntity);
});

const destroy = catchAsync(async (req, res) => {
    const { legalEntityId } = req.params;
    if (!legalEntityId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    await legalEntityService.destroyLegalEntity(legalEntityId);
    res.json({ status: 'OK' });
});

const update = catchAsync(async (req, res) => {
    const { legalEntityId } = req.params;
    const { name, legalForm, count, startCoop } = req.body;
    if (!legalEntityId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing id');
    const legalEntity = await legalEntityService.updateLegalEntity(legalEntityId, name, legalForm, count, startCoop);
    res.json(legalEntity);
});

export default {
    getAll,
    create,
    getOne,
    destroy,
    update,
};
