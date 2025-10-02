import ContractorDto from '../dtos/contractor.dto';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import RepairRequest from '../models/repairRequest';
import sequelize, { Op } from 'sequelize';
import { statusesRuLocale } from '../config/statuses';
import ObjectDir from '../models/object';
import Unit from '../models/unit';
import LegalEntity from '../models/legalEntity';
import ExtContractor from '../models/externalContractor';
import DirectoryCategory from '../models/directoryCategory';
import TgUser from '../models/tgUser';
import { ContractorManagerDto } from '../dtos/contractorManager.dto';

const getAllContractors = async (): Promise<ContractorDto[]> => {
    const contractors = await Contractor.findAll({ order: [['name', 'asc']] });
    return contractors.map(contractor => new ContractorDto(contractor));
};

const getAllContractorsAndManagers = async (): Promise<ContractorManagerDto[]> => {
    const contractors = await Contractor.findAll({ order: [['name', 'asc']] });
    const contractorDtos = contractors.map(c => new ContractorManagerDto(c, false));

    const managers = await TgUser.findAll({
        where: { role: 2 },
        order: [['name', 'asc']],
    });
    const managerDtos = managers.map(m => new ContractorManagerDto(m, true));

    return [...contractorDtos, ...managerDtos];
};

const createContractor = async (name: string): Promise<ContractorDto> => {
    const contractor = await Contractor.create({ name });
    return new ContractorDto(contractor);
};

const getOneContractorById = async (id: string): Promise<Contractor | null> => {
    return await Contractor.findByPk(id);
};

const getContractorsRequests = async (id: string, filter: any): Promise<RequestDto[]> => {
    let requests;
    const whereParams = {};
    const contractor = await Contractor.findByPk(id);
    if (!contractor) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found contractor');

    Object.keys(filter).forEach((k: any) =>
        k === 'search'
            ? null
            : k !== 'contractor'
              ? // @ts-expect-error skip
                (whereParams[k] = filter[k])
              : // @ts-expect-error skip
                (whereParams['$Contractor.name$'] = filter[k])
    );
    // @ts-expect-error skip
    whereParams['contractorId'] = contractor.id;
    if (Object.keys(filter).length !== 0 && typeof filter.search !== 'undefined') {
        const searchParams = [
            {
                status: (() => {
                    return Object.keys(statusesRuLocale)
                        .filter(s =>
                            // @ts-expect-error skip
                            statusesRuLocale[s].includes(
                                Number.isInteger(filter.search) ? filter.search : filter.search.toLowerCase()
                            )
                        )
                        .map(s => s);
                })(),
            },
            { '$Unit.name$': { [Op.iLike]: `%${filter.search}%` } },
            { builder: { [Op.iLike]: `%${filter.search}%` } },
            { '$Object.name$': { [Op.iLike]: `%${filter.search}%` } },
            { problemDescription: { [Op.iLike]: `%${filter.search}%` } },
            { urgency: { [Op.iLike]: `%${filter.search}%` } },
            sequelize.where(sequelize.cast(sequelize.col('repair_price'), 'varchar'), {
                [Op.iLike]: `%${filter.search}%`,
            }),
            { comment: { [Op.iLike]: `%${filter.search}%` } },
            { '$LegalEntity.name$': { [Op.iLike]: `%${filter.search}%` } },
            { '$Contractor.name$': { [Op.iLike]: `%${filter.search}%` } },
        ];
        if (Number.isInteger(filter.search)) {
            // @ts-expect-error skip
            searchParams.push({ number: filter.search });
            // @ts-expect-error skip
            searchParams.push({ itineraryOrder: filter.search });
            // @ts-expect-error skip
            searchParams.push({ daysAtWork: filter.search });
        }
        requests = await RepairRequest.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: searchParams,
                    },
                    whereParams,
                ],
            },
            include: [
                {
                    model: Contractor,
                },
                {
                    model: ObjectDir,
                },
                {
                    model: Unit,
                },
                {
                    model: LegalEntity,
                },
                {
                    model: ExtContractor,
                },
            ],
            order: [['number', 'desc']],
        });
    } else {
        requests = await RepairRequest.findAll({
            where: whereParams,
            include: [
                { model: Contractor },
                { model: ObjectDir },
                { model: Unit },
                { model: LegalEntity },
                { model: ExtContractor },
            ],
            order: [['number', 'desc']],
        });
    }
    return requests.map(request => new RequestDto(request));
};

const getContractorsItinerary = async (id: string, filter: any): Promise<RequestDto[]> => {
    let requests;
    const whereParams = {};
    Object.keys(filter).forEach((k: any) =>
        k === 'search'
            ? null
            : k !== 'contractor'
              ? // @ts-expect-error skip
                (whereParams[k] = filter[k])
              : // @ts-expect-error skip
                (whereParams['$Contractor.name$'] = filter[k])
    );
    const contractor = await Contractor.findByPk(id);
    if (!contractor) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found contractor');
    if (Object.keys(filter).length !== 0 && typeof filter.search !== 'undefined') {
        const searchParams = [
            {
                status: (() => {
                    return Object.keys(statusesRuLocale)
                        .filter(s =>
                            // @ts-expect-error skip
                            statusesRuLocale[s].includes(
                                Number.isInteger(filter.search) ? filter.search : filter.search.toLowerCase()
                            )
                        )
                        .map(s => s);
                })(),
            },
            { '$Unit.name$': { [Op.iLike]: `%${filter.search}%` } },
            { builder: { [Op.iLike]: `%${filter.search}%` } },
            { '$Object.name$': { [Op.iLike]: `%${filter.search}%` } },
            { problemDescription: { [Op.iLike]: `%${filter.search}%` } },
            { urgency: { [Op.iLike]: `%${filter.search}%` } },
            sequelize.where(sequelize.cast(sequelize.col('repair_price'), 'varchar'), {
                [Op.iLike]: `%${filter.search}%`,
            }),
            { comment: { [Op.iLike]: `%${filter.search}%` } },
            { '$LegalEntity.name$': { [Op.iLike]: `%${filter.search}%` } },
            { '$Contractor.name$': { [Op.iLike]: `%${filter.search}%` } },
        ];
        if (Number.isInteger(filter.search)) {
            // @ts-expect-error skip
            searchParams.push({ number: filter.search });
            // @ts-expect-error skip
            searchParams.push({ itineraryOrder: filter.search });
            // @ts-expect-error skip
            searchParams.push({ daysAtWork: filter.search });
        }
        requests = await RepairRequest.findAll({
            where: {
                [Op.and]: [
                    { contractorId: contractor.id, urgency: 'Маршрут', status: { [Op.notIn]: [3, 4] } },
                    {
                        [Op.or]: searchParams,
                    },
                    whereParams,
                ],
            },
            include: [{ model: Contractor }, { model: ObjectDir }, { model: Unit }, { model: LegalEntity }],
            order: [['itineraryOrder', 'ASC']],
        });
    } else {
        requests = await RepairRequest.findAll({
            where: {
                [Op.and]: [
                    { contractorId: contractor.id, urgency: 'Маршрут', status: { [Op.notIn]: [3, 4] } },
                    whereParams,
                ],
            },
            include: [{ model: Contractor }, { model: ObjectDir }, { model: Unit }, { model: LegalEntity }],
            order: [['itineraryOrder', 'ASC']],
        });
    }
    return requests.map(request => new RequestDto(request));
};

// Поиск актуальных заявок по объектам  - 1, 2 и 5 статусы
export const getContractorsActualRequests = async (contractorId: string, unitId: string, objectId?: string) => {
    const actualStatuses = [1, 2, 5];

    const unitObjects = await ObjectDir.findAll({
        where: { unitId },
        attributes: ['id'],
    });
    const unitObjectIds = unitObjects.map(uo => uo.id);

    const whereClause: any = {
        status: { [Op.in]: actualStatuses },
        contractorId,
    };

    if (objectId) {
        if (unitObjectIds.includes(objectId)) {
            whereClause.objectId = objectId;
        } else {
            return [];
        }
    } else {
        whereClause.objectId = { [Op.in]: unitObjectIds };
    }

    const requests = await RepairRequest.findAll({
        where: whereClause,
        include: [
            { model: Unit },
            { model: Contractor },
            { model: TgUser },
            { model: DirectoryCategory },
            { model: ObjectDir },
        ],
        order: [['createdAt', 'DESC']],
    });

    return requests.map(r => new RequestDto(r));
};

export default {
    getAllContractors,
    createContractor,
    getOneContractorById,
    getContractorsRequests,
    getContractorsItinerary,
    getContractorsActualRequests,
    getAllContractorsAndManagers,
};
