import catchAsync from '../utils/catchAsync';
import prepare from '../utils/prepare';
import pick from '../utils/pick';
import categoryService from '../services/category.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = catchAsync(async (req, res) => {
    const pagination = prepare(pick(req.query, ['limit', 'offset']));
    const categories = await categoryService.getAll(pagination);
    res.json(categories);
});

const getOne = catchAsync(async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing categoryId');
    const category = await categoryService.getOne(categoryId);
    res.json(category);
});

const create = catchAsync(async (req, res) => {
    const { name, comment } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    const category = await categoryService.create(name, comment);
    res.json(category);
});

const update = catchAsync(async (req, res) => {
    const { name, comment } = req.body;
    const { categoryId } = req.params;
    if (!name && !comment) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing body');
    if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing categoryId');
    await categoryService.update(categoryId, name, comment);
    res.json({ status: 'OK' });
});

const destroy = catchAsync(async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing categoryId');
    await categoryService.destroy(categoryId);
    res.json({ status: 'ok' });
});

export default {
    getAll,
    getOne,
    create,
    update,
    destroy,
};
