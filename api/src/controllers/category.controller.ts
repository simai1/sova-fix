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

const create = catchAsync(async (req, res) => {
    const { name } = req.body;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    const category = await categoryService.create(name);
    res.json(category);
});

const update = catchAsync(async (req, res) => {
    const { name } = req.body;
    const { categoryId } = req.params;
    if (!name) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing name');
    if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing categoryId');
    const category = await categoryService.update(categoryId, name);
    res.json(category);
});

const destroy = catchAsync(async (req, res) => {
    const { categoryId } = req.params;
    if (!categoryId) throw new ApiError(httpStatus.BAD_REQUEST, 'Missing categoryId');
    await categoryService.destroy(categoryId);
    res.json({ status: 'ok' });
});

export default {
    getAll,
    create,
    update,
    destroy,
};
