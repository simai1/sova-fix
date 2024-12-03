import catchAsync from '../utils/catchAsync';
import prepare from '../utils/prepare';
import pick from '../utils/pick';
import nomenclatureService from '../services/nomenclature.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = catchAsync(async (req, res) => {
    const pagination = prepare(pick(req.query, ['limit', 'offset']));
    const nomenclatures = await nomenclatureService.getAll(pagination);
    res.json(nomenclatures);
});

const getOne = catchAsync(async (req, res) => {
    const { nomenclatureId } = req.params;
    if (!nomenclatureId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing nomenclatureId');
    const nomenclature = await nomenclatureService.getOne(nomenclatureId);
    res.json(nomenclature);
});

const create = catchAsync(async (req, res) => {
    const { name, comment, categoryId } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing categoryId');
    const nomenclature = await nomenclatureService.create(name, comment, categoryId);
    res.json(nomenclature);
});

const update = catchAsync(async (req, res) => {
    const { nomenclatureId } = req.params;
    const { name, comment, categoryId } = req.body;
    if (!nomenclatureId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing nomenclatureId');
    if (!name && !comment && !categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');
    await nomenclatureService.update(nomenclatureId, name, comment, categoryId);
    res.json({ status: 'OK' });
});

const destroy = catchAsync(async (req, res) => {
    const { nomenclatureId } = req.params;
    if (!nomenclatureId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing nomenclatureId');
    await nomenclatureService.destroy(nomenclatureId);
    res.json({ status: 'OK' });
});

export default {
    getAll,
    getOne,
    create,
    update,
    destroy,
};
