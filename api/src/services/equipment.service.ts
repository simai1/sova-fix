import Equipment from '../models/equipment';
import Category from '../models/category';
import Contractor from '../models/contractor';
import ExtContractor from '../models/externalContractor';
import ObjectDir from '../models/object';
import Unit from '../models/unit';
import EquipmentDto from '../dtos/equipment.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const create = async (
    supportFrequency: number | undefined,
    name: string,
    lastTO: Date | undefined,
    nextTO: Date,
    comment: string | undefined,
    categoryName: string | undefined,
    objectId: string,
    contractorId: string | undefined,
    extContractorId: string | undefined,
    photo: string | undefined
) => {
    const object = await ObjectDir.findByPk(objectId, { include: [{ model: Unit }] });
    if (!object) throw new ApiError(httpStatus.BAD_REQUEST, 'No object with id ' + objectId);
    let category = await Category.findOne({ where: { name: categoryName } });
    if (!category) category = await Category.create({ name: categoryName });
    let contractor, extContractor;
    if (contractorId) {
        contractor = await Contractor.findByPk(contractorId);
        if (!contractor) throw new ApiError(httpStatus.BAD_REQUEST, 'No contractor with id ' + contractorId);
    }
    if (extContractor) {
        extContractor = await ExtContractor.findByPk(extContractorId);
        if (!extContractor) throw new ApiError(httpStatus.BAD_REQUEST, 'No extContractor with id ' + extContractorId);
    }
    const equipment = await Equipment.create({
        number: 0,
        name,
        supportFrequency,
        lastTO,
        nextTO,
        comment,
        photo,
        categoryId: category.id,
        unitId: object.Unit?.id,
        objectId,
        contractorId,
        extContractorId,
    });
    equipment.Category = category;
    equipment.Unit = object.Unit;
    equipment.ExtContractor = extContractor;
    equipment.Contractor = contractor;
    equipment.Object = object;
    return new EquipmentDto(equipment);
};

const getAll = async (pagination: any) => {
    const equipment = await Equipment.findAll({
        include: [
            { model: Category },
            { model: Contractor },
            { model: ExtContractor },
            { model: ObjectDir, include: [{ model: Unit }] },
        ],
        limit: pagination.limit,
        offset: pagination.offset,
    });
    return equipment.map(e => new EquipmentDto(e));
};

const getOne = async (equipmentId: string) => {
    const equipment = await Equipment.findByPk(equipmentId, {
        include: [
            { model: Category },
            { model: Contractor },
            { model: ExtContractor },
            { model: ObjectDir, include: [{ model: Unit }] },
        ],
    });
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    return new EquipmentDto(equipment);
};

const destroy = async (equipmentId: string) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    await equipment.destroy();
};

const update = async (
    equipmentId: string,
    supportFrequency: number | undefined,
    name: string | undefined,
    lastTO: Date | undefined,
    nextTO: Date | undefined,
    comment: string | undefined,
    photo: string | undefined,
    categoryName: string | undefined,
    objectId: string | undefined,
    contractorId: string | undefined,
    extContractorId: string | undefined
) => {
    const equipment = await Equipment.findByPk(equipmentId);
    if (!equipment) throw new ApiError(httpStatus.BAD_REQUEST, 'No equipment with id ' + equipmentId);
    let category;
    if (categoryName) {
        category = await Category.findOne({ where: { name: categoryName } });
        if (!category) category = await Category.create({ name: categoryName });
    }
    if (objectId) {
        const object = await ObjectDir.findByPk(objectId);
        if (!object) throw new ApiError(httpStatus.BAD_REQUEST, 'No object with id ' + objectId);
    }
    if (contractorId) {
        const contractor = await Contractor.findByPk(contractorId);
        if (!contractor) throw new ApiError(httpStatus.BAD_REQUEST, 'No contractor with id ' + contractorId);
    }
    if (extContractorId) {
        const extContractor = await ExtContractor.findByPk(extContractorId);
        if (!extContractor) throw new ApiError(httpStatus.BAD_REQUEST, 'No extContractor with id ' + extContractorId);
    }
    await equipment.update({
        supportFrequency,
        name,
        lastTO,
        nextTO,
        comment,
        photo,
        categoryId: category ? category.id : undefined,
        objectId,
        contractorId: contractorId ? contractorId : null,
        extContractorId: extContractorId ? extContractorId : null,
    });
};

export default {
    create,
    getAll,
    getOne,
    destroy,
    update,
};
