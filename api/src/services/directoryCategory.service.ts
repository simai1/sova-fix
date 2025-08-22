import httpStatus from 'http-status';
import { DirectoryCategoryDto } from '../dtos/directoryCategory.dto';
import DirectoryCategory from '../models/directoryCategory';
import ApiError from '../utils/ApiError';
import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import ExtContractor from '../models/externalContractor';
import User from '../models/user';
import TgUser from '../models/tgUser';
import { Op } from 'sequelize';
import tgUserService from './tgUser.service';
import DirectoryCategoryCustomer from '../models/directoryCategoryCustomer';

const getAllDirectoryCategory = async () => {
    const directoryCategory = await DirectoryCategory.findAll({
        order: [['number', 'ASC']],
        include: [
            { model: Contractor, as: 'builder' },
            { model: ExtContractor, as: 'builderExternal' },
            { model: TgUser, as: 'manager' },
            { model: TgUser, as: 'customers' },
        ],
    });

    return directoryCategory.map(o => new DirectoryCategoryDto(o));
};

const createDirectoryCategory = async (
    name: string,
    color: string,
    customersIds?: string,
    builderId?: string,
    builderExternalId?: string,
    isExternal?: boolean,
    managerId?: string,
    isManager?: boolean
) => {
    try {
        const isHasSameName = await DirectoryCategory.findOne({ where: { name } });
        if (isHasSameName)
            throw new ApiError(httpStatus.BAD_REQUEST, 'Directory Category with this name is already exist!');
        const directoryCategory = await DirectoryCategory.create({
            name,
            color,
            customersIds: customersIds,
            builderId: builderId || null,
            number: 1,
            isExternal,
            builderExternalId,
            managerId,
            isManager,
            isForAllCustomers: customersIds?.length ? false : true,
        });
        if (customersIds?.length) {
            const idsArray = Array.isArray(customersIds) ? customersIds : [customersIds];
            await directoryCategory.setCustomers(idsArray);
        }

        const fullCategory = await DirectoryCategory.findByPk(directoryCategory.id, {
            include: [
                { model: Contractor, as: 'builder' },
                { model: ExtContractor, as: 'builderExternal' },
                { model: TgUser, as: 'manager' },
                { model: TgUser, as: 'customers' },
            ],
        });

        return new DirectoryCategoryDto(fullCategory!);
    } catch (e) {
        console.log(e);
    }
};

const updateDirectoryCategory = async (
    directoryCategoryId: string,
    name: string,
    color: string,
    customersIds?: string | string[],
    builderId?: string,
    builderExternalId?: string,
    isExternal?: boolean,
    managerId?: string,
    isManager?: boolean
) => {
    const directoryCategory = await DirectoryCategory.findByPk(directoryCategoryId);
    if (!directoryCategory)
        throw new ApiError(httpStatus.BAD_REQUEST, `Directory Category with id "${directoryCategoryId}" is not exist!`);

    const isHasSameName = await DirectoryCategory.findOne({
        where: { name, id: { [Op.ne]: directoryCategoryId } },
    });
    if (isHasSameName)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Directory Category with this name is already exist!');

    await directoryCategory.update({
        name,
        color,
        builderId: builderId || null,
        isExternal,
        builderExternalId,
        managerId,
        isManager,
        isForAllCustomers: customersIds?.length ? false : true,
    });

    if (customersIds === null) {
        await directoryCategory.setCustomers([]);
    } else if (customersIds) {
        const idsArray = Array.isArray(customersIds) ? customersIds : [customersIds];
        await directoryCategory.setCustomers(idsArray);
    }

    const fullCategory = await DirectoryCategory.findByPk(directoryCategory.id, {
        include: [
            { model: Contractor, as: 'builder' },
            { model: ExtContractor, as: 'builderExternal' },
            { model: TgUser, as: 'manager' },
            { model: TgUser, as: 'customers' },
        ],
    });

    return new DirectoryCategoryDto(fullCategory!);
};

const deleteDirectoryCategory = async (directoryCategoryId: string) => {
    const directoryCategory = await DirectoryCategory.findByPk(directoryCategoryId);
    if (!directoryCategory)
        throw new ApiError(httpStatus.BAD_REQUEST, `Directory Category with id "${directoryCategoryId}" is not exist!`);
    await RepairRequest.update({ directoryCategoryId: null }, { where: { directoryCategoryId: directoryCategoryId } });
    return await directoryCategory.destroy({ force: true });
};

const getAllBuilders = async () => {
    const allContractors = await Contractor.findAll();
    const allExtContractors = await ExtContractor.findAll();
    const allManagers = await tgUserService.getAllManagers();

    const contractorsData = allContractors?.map(c => ({
        label: `Внутренний: ${c.name}`,
        value: c.id,
        isExternal: false,
        isManager: false,
    }));

    const extContractorsData = allExtContractors?.map(ext => ({
        label: `Внешний: ${ext.name}`,
        value: ext.id,
        isExternal: true,
        isManager: false,
    }));

    const managersData = allManagers.map(m => ({
        label: `Менеджер: ${m.name}`,
        value: m.id,
        isExternal: false,
        isManager: true,
    }));

    return [...contractorsData, ...extContractorsData, ...managersData];
};

const getAllCustomers = async () => {
    const allCustomers = await TgUser.findAll({ where: { role: 3 } });

    const customersOptions = allCustomers?.map(customer => ({
        label: customer.name,
        value: customer.id,
    }));

    return [{ label: 'Все заказчики', value: null }, ...customersOptions];
};
const getUsersDirectoryCategories = async (tgId: string) => {
    const customer = await TgUser.findOne({ where: { tgId } });

    if (!customer) throw new ApiError(httpStatus.BAD_REQUEST, `Tg User with id "${tgId}" is not exist!`);

    if (customer.role === 2) {
        const customersCategories = await DirectoryCategory.findAll();
        return customersCategories;
    }

    const customersCategories = await TgUser.findOne({
        where: { tgId },
        include: [{ model: DirectoryCategory, as: 'categories' }],
    });

    if (!customersCategories) throw new ApiError(httpStatus.BAD_REQUEST, `Tg User with id "${tgId}" is not exist!`);

    const categories = customersCategories.categories;

    const categoriesForAll = await DirectoryCategory.findAll({ where: { isForAllCustomers: true } });

    const mapedCategories = categories?.map(c => new DirectoryCategoryDto(c));
    return [...categoriesForAll, ...mapedCategories ?? []];
};

export default {
    getAllDirectoryCategory,
    createDirectoryCategory,
    updateDirectoryCategory,
    deleteDirectoryCategory,
    getAllBuilders,
    getAllCustomers,
    getUsersDirectoryCategories,
};
