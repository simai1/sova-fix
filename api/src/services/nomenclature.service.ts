import Nomenclature from '../models/nomenclature';
import NomenclatureDto from '../dtos/nomenclature.dto';
import Category from '../models/category';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAll = async (pagination: any) => {
    const nomenclatures = await Nomenclature.findAll({
        limit: pagination.limit,
        offset: pagination.offset,
        order: [['name', 'ASC']],
        include: [{ model: Category }],
    });
    return nomenclatures.map(n => new NomenclatureDto(n));
};

const getOne = async (nomenclatureId: string) => {
    const nomenclature = await Nomenclature.findByPk(nomenclatureId, { include: [{ model: Category }] });
    if (!nomenclature) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found nomenclature with id ' + nomenclatureId);
    return new NomenclatureDto(nomenclature);
};

const create = async (name: string, comment: string | undefined, categoryId: string) => {
    const category = await Category.findByPk(categoryId);
    if (!category) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found category with id ' + categoryId);
    const nomenclature = await Nomenclature.create({ name, comment, categoryId });
    nomenclature.Category = category;
    return new NomenclatureDto(nomenclature);
};

const update = async (
    nomenclatureId: string,
    name: string | undefined,
    comment: string | undefined,
    categoryId: string | undefined
) => {
    const nomenclature = await Nomenclature.findByPk(nomenclatureId);
    if (!nomenclature) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found nomenclature with id ' + nomenclatureId);
    await nomenclature.update({ name, comment, categoryId });
};

const destroy = async (nomenclatureId: string) => {
    const nomenclature = await Nomenclature.findByPk(nomenclatureId);
    if (!nomenclature) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found nomenclature with id ' + nomenclatureId);
    await nomenclature.destroy();
};

export default {
    getAll,
    getOne,
    create,
    update,
    destroy,
};
