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
import User from '../models/user';
import { contractorInclude } from '../utils/contractorInclude';
import { contractorNameIn, contractorNameILike, contractorNameOrderExpr } from '../utils/contractorNameFilter';

const getAllContractors = async (): Promise<ContractorDto[]> => {
    const contractors = await Contractor.findAll({
        include: [
            { model: User, attributes: ['id', 'name'] },
            { model: TgUser, attributes: ['id', 'name', 'tgId'] },
        ],
        order: [[contractorNameOrderExpr('contractor'), 'ASC']],
    });
    return contractors.map(contractor => new ContractorDto(contractor));
};

const getOneContractorById = async (id: string): Promise<Contractor | null> => {
    return await Contractor.findByPk(id);
};

const buildContractorWhereParams = (filter: any) => {
    const whereParams: any = {};
    Object.keys(filter).forEach((k: any) => {
        if (k === 'search') return;
        if (k !== 'contractor') {
            whereParams[k] = filter[k];
        } else {
            whereParams[Op.and] = [
                ...(whereParams[Op.and] || []),
                contractorNameIn(Array.isArray(filter[k]) ? filter[k] : [filter[k]]),
            ];
        }
    });
    return whereParams;
};

const getContractorsRequests = async (id: string, filter: any): Promise<RequestDto[]> => {
    let requests;
    const whereParams = buildContractorWhereParams(filter);
    const contractor = await Contractor.findByPk(id);
    if (!contractor) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found contractor');

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
            contractorNameILike(`%${filter.search}%`),
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
                contractorInclude,
                { model: ObjectDir },
                { model: Unit },
                { model: LegalEntity },
                { model: ExtContractor },
            ],
            order: [['number', 'desc']],
        });
    } else {
        requests = await RepairRequest.findAll({
            where: whereParams,
            include: [
                contractorInclude,
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
    const whereParams = buildContractorWhereParams(filter);
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
            contractorNameILike(`%${filter.search}%`),
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
            include: [contractorInclude, { model: ObjectDir }, { model: Unit }, { model: LegalEntity }],
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
            include: [contractorInclude, { model: ObjectDir }, { model: Unit }, { model: LegalEntity }],
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
            contractorInclude,
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
    getOneContractorById,
    getContractorsRequests,
    getContractorsItinerary,
    getContractorsActualRequests,
};
