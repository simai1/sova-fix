import httpStatus from 'http-status';
import { DirectoryCategoryDto } from '../dtos/directoryCategory.dto';
import DirectoryCategory from '../models/directoryCategory';
import ApiError from '../utils/ApiError';
import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import ExtContractor from '../models/externalContractor';
import User from '../models/user';
import TgUser from '../models/tgUser';

const getAllDirectoryCategory = async () => {
    const directoryCategory = await DirectoryCategory.findAll({ order: [['number', 'ASC']] });
    return directoryCategory.map(o => new DirectoryCategoryDto(o));
};

const createDirectoryCategory = async (name: string, color: string, customersId?: string, builderId?: string) => {
    const isHasSameName = await DirectoryCategory.findOne({ where: { name } });
    if (isHasSameName)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Directory Category with this name is already exist!');
    const directoryCategory = await DirectoryCategory.create({ name, color, customersId, builderId, number: 1 });
    return new DirectoryCategoryDto(directoryCategory);
};

const updateDirectoryCategory = async (
    directoryCategoryId: string,
    name: string,
    color: string,
    customersId?: string,
    builderId?: string
) => {
    const directoryCategory = await DirectoryCategory.findByPk(directoryCategoryId);
    if (!directoryCategory)
        throw new ApiError(httpStatus.BAD_REQUEST, `Directory Category with id "${directoryCategoryId}" is not exist!`);
    const isHasSameName = await DirectoryCategory.findOne({ where: { name } });
    if (isHasSameName)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Directory Category with this name is already exist!');
    const updatedDirectoryCategory = await directoryCategory.update({ name, color, customersId, builderId });
    return new DirectoryCategoryDto(updatedDirectoryCategory);
};

const deleteDirectoryCategory = async (directoryCategoryId: string) => {
    const directoryCategory = await DirectoryCategory.findByPk(directoryCategoryId);
    if (!directoryCategory)
        throw new ApiError(httpStatus.BAD_REQUEST, `Directory Category with id "${directoryCategoryId}" is not exist!`);
    await RepairRequest.update({ directoryCategory: null }, { where: { directoryCategory: directoryCategoryId } });
    return await directoryCategory.destroy();
};

const getAllBuilders = async () => {
    const allContractors = await Contractor.findAll();
    const allExtContractors = await ExtContractor.findAll();
    const allManagers = await User.findAll({ where: { role: 2 } });

    const contractorsData = allContractors?.map(c => ({
        label: `Внутренний: ${c.name}`,
        value: c.id,
    }));

    const extContractorsData = allExtContractors?.map(ext => ({
        label: `Внешний: ${ext.name}`,
        value: ext.id,
    }));

    const managersData = allManagers?.map(m => ({
        label: `Менеджер: ${m.name}`,
        value: m.id,
    }));

    return [...contractorsData, ...extContractorsData, ...managersData];
};

const getAllCustomers = async () => {
    const allCustomers = await TgUser.findAll({ where: { role: 3 } });

    const customersOptions = allCustomers?.map(customer => ({
        label: customer.name,
        value: customer.id,
    }));

    return [{ label: 'Все заказчики', value: '' }, ...customersOptions];
};

export default {
    getAllDirectoryCategory,
    createDirectoryCategory,
    updateDirectoryCategory,
    deleteDirectoryCategory,
    getAllBuilders,
    getAllCustomers,
};
