import Category from '../models/category';
import CategoryDto from '../dtos/category.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = async (pagination: any) => {
    const categories = await Category.findAll({ limit: pagination.limit, offset: pagination.offset });
    return categories.map(c => new CategoryDto(c));
};

const create = async (name: string) => {
    const category = await Category.create({ name });
    return new CategoryDto(category);
};

const update = async (categoryId: string, name: string) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found category with id ' + categoryId);
    category.name = name;
    await category.save();
    return new CategoryDto(category);
};

const destroy = async (categoryId: string) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found category with id ' + categoryId);
    await category.destroy({ force: true });
};

export default {
    getAll,
    create,
    update,
    destroy,
};
