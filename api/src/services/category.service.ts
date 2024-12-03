import Category from '../models/category';
import CategoryDto from '../dtos/category.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = async (pagination: any) => {
    const categories = await Category.findAll({
        limit: pagination.limit,
        offset: pagination.offset,
        order: [['name', 'ASC']],
    });
    return categories.map(c => new CategoryDto(c));
};

const getOne = async (categoryId: string) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found category with id ' + categoryId);
    return new CategoryDto(category);
};

const create = async (name: string, comment: string | undefined) => {
    const category = await Category.create({ name, comment });
    return new CategoryDto(category);
};

const update = async (categoryId: string, name: string | undefined, comment: string | undefined) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found category with id ' + categoryId);
    await category.update({ name, comment });
};

const destroy = async (categoryId: string) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found category with id ' + categoryId);
    await category.destroy({ force: true });
};

export default {
    getAll,
    getOne,
    create,
    update,
    destroy,
};
