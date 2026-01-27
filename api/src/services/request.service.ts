import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { Op } from 'sequelize';
import { statusesRuLocale } from '../config/statuses';
import sequelize from 'sequelize';
import { sendMsg, WsMsgData } from '../utils/ws';
import TgUser from '../models/tgUser';
import ObjectDir from '../models/object';
import objectService from './object.service';
import Unit from '../models/unit';
import LegalEntity from '../models/legalEntity';
import ExtContractor from '../models/externalContractor';
import * as util from 'node:util';
import logger from '../utils/logger';
import { models } from '../models';
import Urgency from '../models/urgency';
import User from '../models/user';
import TgUserObject from '../models/tgUserObject';
import Status from '../models/status';
import { normalizeFileNames } from '../utils/normalizeData';
import DirectoryCategory from '../models/directoryCategory';
import Settings from '../models/settings';

const getAllRequests = async (filter: any, order: any, pagination: any, userId?: string) => {
    try {
        let requests;
        const whereParams: any = {};
        const allStatuses = await Status.findAll();

        if (userId) {
            let objectIdsForUser: string[] | null = null;
            const user = await User.findOne({ where: { id: userId } });
            if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User is Not Founded');
            const tgUser = await TgUser.findOne({ where: { id: user?.tgManagerId } });

            if (tgUser?.role === 3) {
                const userObjects = await TgUserObject.findAll({ where: { tg_user_id: user?.tgManagerId } });
                objectIdsForUser = userObjects.map(obj => obj.objectId);

                // Если пользователь с ролью 3 и нет привязанных объектов — фильтруем по пустому массиву (не вернёт ничего)
                if (objectIdsForUser.length === 0) {
                    whereParams['$Object.id$'] = { [Op.in]: [] };
                } else {
                    whereParams['$Object.id$'] = { [Op.in]: objectIdsForUser };
                }
            }
        }
        Object.keys(filter).forEach((key: string) => {
            if (key === 'search') {
                return;
            }
            const isExclusion = key.startsWith('exclude_');
            const fieldName = isExclusion ? key.replace('exclude_', '') : key;

            let value = Array.isArray(filter[key]) ? filter[key] : [filter[key]];

            if (fieldName === 'contractor') {
                value = value.map((v: any) => (v === null ? 'null' : v));
                if (isExclusion) {
                    if (value.includes('null')) {
                        whereParams[Op.and] = [
                            {
                                contractorId: value.includes('null') ? { [Op.not]: null } : { [Op.is]: null },
                            },
                            { '$Contractor.name$': { [Op.notIn]: value } },
                        ];
                    } else {
                        whereParams[Op.or] = [
                            {
                                contractorId: value.includes('null') ? { [Op.not]: null } : { [Op.is]: null },
                            },
                            { '$Contractor.name$': { [Op.notIn]: value } },
                        ];
                    }
                } else {
                    if (value.includes('null')) {
                        whereParams[Op.or] = [
                            {
                                contractorId: value.includes('null') ? { [Op.is]: null } : { [Op.not]: null },
                            },
                            { '$Contractor.name$': { [Op.in]: value } },
                        ];
                    } else {
                        whereParams[Op.and] = [
                            {
                                contractorId: value.includes('null') ? { [Op.is]: null } : { [Op.not]: null },
                            },
                            { '$Contractor.name$': { [Op.in]: value } },
                        ];
                    }
                }
            } else if (fieldName === 'legalEntity') {
                value = value.map((v: any) => (v === null ? 'null' : v));
                if (isExclusion) {
                    if (value.includes('null')) {
                        whereParams[Op.and] = [
                            {
                                legalEntityId: value.includes('null') ? { [Op.not]: null } : { [Op.is]: null },
                            },
                            { '$LegalEntity.name$': { [Op.notIn]: value } },
                        ];
                    } else {
                        whereParams[Op.or] = [
                            {
                                legalEntityId: value.includes('null') ? { [Op.not]: null } : { [Op.is]: null },
                            },
                            { '$LegalEntity.name$': { [Op.notIn]: value } },
                        ];
                    }
                } else {
                    if (value.includes('null')) {
                        whereParams[Op.or] = [
                            {
                                legalEntityId: value.includes('null') ? { [Op.is]: null } : { [Op.not]: null },
                            },
                            { '$LegalEntity.name$': { [Op.in]: value } },
                        ];
                    } else {
                        whereParams[Op.and] = [
                            {
                                legalEntityId: value.includes('null') ? { [Op.is]: null } : { [Op.not]: null },
                            },
                            { '$LegalEntity.name$': { [Op.in]: value } },
                        ];
                    }
                }
            } else if (fieldName === 'directoryCategory') {
                whereParams['$DirectoryCategory.name$'] = isExclusion ? { [Op.notIn]: value } : { [Op.in]: value };
            } else if (fieldName === 'object') {
                whereParams['$Object.name$'] = isExclusion ? { [Op.notIn]: value } : { [Op.in]: value };
            } else if (fieldName === 'unit') {
                whereParams['$Unit.name$'] = isExclusion ? { [Op.notIn]: value } : { [Op.in]: value };
            } else if (fieldName === 'status') {
                const statusMap = Object.fromEntries(allStatuses.map(s => [s.name.toLowerCase().trim(), s.number]));
                value = value.map((v: any) => {
                    if (!isNaN(Number(v))) return Number(v);

                    const mapped = statusMap[v.toLowerCase().trim()];
                    if (!mapped) throw new Error(`Неизвестный статус: ${v}`);
                    return mapped;
                });
                whereParams[fieldName] = isExclusion ? { [Op.notIn]: value } : { [Op.in]: value };
            } else if (fieldName === 'checkPhoto') {
                whereParams[fieldName] = value.includes(null)
                    ? { [Op.is]: null }
                    : isExclusion
                      ? { [Op.notIn]: value }
                      : { [Op.in]: value };
            } else if (fieldName === 'isAutoCreated') {
                console.log(value);
                whereParams[fieldName] = { [Op.is]: value.includes('true') };
            } else if (fieldName === 'isExternal') {
                whereParams[fieldName] = { [Op.is]: value.includes('true') };
            } else if (fieldName === 'managerTgId') {
                logger.info(`Filtering by managerTgId: ${filter.managerTgId}`);
                // Ensure managerTgId is treated as string
                whereParams[fieldName] = String(filter.managerTgId);
            } else if (fieldName === 'managerId') {
                logger.info(`Filtering by managerId: ${filter.managerId}`);
                // Handle both UUID string and numeric managerId for backward compatibility
                const managerIdValue = filter.managerId;
                if (typeof managerIdValue === 'string' && managerIdValue.includes('-')) {
                    // UUID format
                    whereParams[fieldName] = managerIdValue;
                } else {
                    // For legacy numeric IDs, we need to search both as string and number
                    // since some old records might have numeric managerId
                    const managerConditions = [
                        { [fieldName]: String(managerIdValue) },
                        { [fieldName]: Number(managerIdValue) },
                    ];

                    // If there's already an Op.or condition, merge with it
                    if (whereParams[Op.or]) {
                        whereParams[Op.and] = [{ [Op.or]: whereParams[Op.or] }, { [Op.or]: managerConditions }];
                        delete whereParams[Op.or];
                    } else {
                        whereParams[Op.or] = managerConditions;
                    }
                }
                // Фильтрация по этой проверке написана не очень хорошо. Возникло из-за того, что в фильтре
                // по исполнителю необходимо было фильтровать сразу несколько полей
                // Желательно провести миграцию БД, чтобы все заявки имели общие паттерны поля contractorManager, builder,
                // так как сейчас написано на костылях
            } else if (fieldName === 'builder') {
                const isExternalManager = value.includes('Менеджер: Внешний подрядчик');
                const hasUnknownBuilder = value.includes('Укажите подрядчика');

                if (isExclusion) {
                    const andConditions: any[] = [];

                    if (isExternalManager) {
                        andConditions.push(
                            // Убираем, если ExtContractor.name = null
                            { '$ExtContractor.name$': { [Op.is]: null } },

                            // Убираем заявки, где и Contractor.name, и ExtContractor.name пустые
                            {
                                [Op.or]: [
                                    {
                                        [Op.or]: [
                                            { '$Contractor.name$': { [Op.not]: null } },
                                            { '$ExtContractor.name$': { [Op.not]: null } },
                                        ],
                                    },
                                    {
                                        builder: {
                                            [Op.and]: [
                                                { [Op.iLike]: 'Менеджер:%' },
                                                { [Op.notILike]: 'Менеджер: Внешний подрядчик' },
                                            ],
                                        },
                                    },
                                    {
                                        builder: {
                                            [Op.or]: [
                                                { [Op.notILike]: 'Укажите подрядчика' }, // для случаев без 'Менеджер:'
                                                { [Op.notILike]: 'Менеджер: Внешний подрядчик' },
                                            ],
                                        },
                                    },
                                ],
                            },
                            // Убираем builder, кроме "Менеджер: Внешний подрядчик"
                            {
                                builder: {
                                    [Op.notIn]: value.filter((v: string) => v !== 'Менеджер: Внешний подрядчик'),
                                },
                            }
                        );
                    }

                    if (hasUnknownBuilder) {
                        andConditions.push(
                            {
                                builder: {
                                    [Op.notIn]: value,
                                },
                            },
                            {
                                [Op.not]: {
                                    [Op.and]: [
                                        {
                                            builder: {
                                                [Op.in]: ['Укажите подрядчика', 'Внутренний сотрудник'],
                                            },
                                        },
                                        {
                                            [Op.or]: [
                                                { '$Contractor.id$': { [Op.is]: null } },
                                                { '$Contractor.name$': { [Op.is]: null } },
                                            ],
                                        },
                                    ],
                                },
                            }
                        );
                    }

                    if (!isExternalManager && !hasUnknownBuilder) {
                        whereParams[fieldName] = {
                            [Op.notIn]: value,
                        };
                    } else {
                        whereParams[Op.and] = andConditions;
                    }
                } else {
                    const orConditions: any[] = [];

                    if (isExternalManager) {
                        // Включаем: есть внешний подрядчик ИЛИ builder совпадает
                        orConditions.push(
                            { '$ExtContractor.name$': { [Op.not]: null } },
                            { builder: { [Op.in]: value } }
                        );
                    } else {
                        orConditions.push({ builder: { [Op.in]: value } });
                    }

                    if (hasUnknownBuilder) {
                        // Включаем, но исключаем случаи без contractor
                        whereParams[Op.and] = [
                            ...(whereParams[Op.and] || []),
                            { [Op.or]: orConditions },
                            {
                                [Op.not]: {
                                    [Op.and]: [
                                        {
                                            builder: {
                                                [Op.in]: ['Укажите подрядчика', 'Внутренний сотрудник'],
                                            },
                                        },
                                        {
                                            [Op.or]: [
                                                { contractorName: { [Op.is]: null } },
                                                { '$Contractor.name$': { [Op.is]: null } },
                                            ],
                                        },
                                    ],
                                },
                            },
                        ];
                    } else {
                        // Простое включение
                        whereParams[Op.or] = orConditions;
                    }
                }
            } else {
                whereParams[fieldName] = isExclusion ? { [Op.notIn]: value } : { [Op.in]: value };
            }
        });
        console.log(util.inspect(whereParams, { showHidden: true, depth: null, colors: true }));
        let totalCount;
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
                    { model: Contractor },
                    { model: ObjectDir },
                    { model: Unit },
                    { model: LegalEntity },
                    { model: ExtContractor },
                    { model: TgUser, as: 'TgUser' },
                    { model: DirectoryCategory },
                ],
                order:
                    order.col && order.type
                        ? order.col === 'contractor'
                            ? [['Contractor', 'name', order.type]]
                            : [[order.col, order.type]]
                        : [['number', 'desc']],
                limit: pagination.limit,
                offset: pagination.offset,
            });
            totalCount = await RepairRequest.count({
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
                    {
                        model: TgUser,
                    },
                    { model: DirectoryCategory },
                ],
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
                    { model: TgUser },
                    { model: DirectoryCategory },
                ],
                order:
                    order.col && order.type
                        ? order.col === 'contractor'
                            ? [['Contractor', 'name', order.type]]
                            : [[order.col, order.type]]
                        : [['number', 'desc']],
                limit: pagination.limit,
                offset: pagination.offset,
            });
            totalCount = await RepairRequest.count({
                where: whereParams,
                include: [
                    { model: Contractor },
                    { model: ObjectDir },
                    { model: Unit },
                    { model: LegalEntity },
                    { model: ExtContractor },
                    { model: TgUser },
                    { model: DirectoryCategory },
                ],
            });
        }

        // sort copied
        const sortedRequests: RepairRequest[] = [];
        const copiedRequests: RepairRequest[] = [];
        requests.forEach(request => {
            request.copiedRequestId ? copiedRequests.push(request) : sortedRequests.push(request);
        });
        for (const r of copiedRequests) {
            const targetIndex = sortedRequests.findIndex(sortedRequest => sortedRequest.id === r.copiedRequestId);
            sortedRequests.splice(targetIndex + 1, 0, r);
        }

        return [sortedRequests.map(request => new RequestDto(request)), totalCount];
    } catch (error) {
        logger.error(`Error in getAllRequests: ${error}`);
        throw error;
    }
};

const getRequestById = async (requestId: string): Promise<RequestDto> => {
    const request = await RepairRequest.findByPk(requestId, {
        include: [
            { model: Contractor },
            { model: ObjectDir },
            { model: Unit },
            { model: LegalEntity },
            { model: ExtContractor },
            { model: TgUser },
            { model: DirectoryCategory },
        ],
    });
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    return new RequestDto(request);
};

const createRequest = async (
    objectId: string,
    problemDescription: string | undefined,
    urgency: string,
    repairPrice: number | undefined,
    comment: string | undefined,
    fileName: string,
    tgUserId: string,
    directoryCategoryId: string | undefined
): Promise<RequestDto> => {
    const objectDir = await objectService.getObjectById(objectId);
    if (!objectDir) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    if (!objectDir.Unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit');
    if (!objectDir.LegalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found LegalEntity');
    const urgencyRecord = await Urgency.findOne({ where: { name: urgency } });
    if (!urgencyRecord) throw new ApiError(httpStatus.BAD_REQUEST, `Urgency "${urgency}" not found`);

    const request = await RepairRequest.create({
        unitId: objectDir.Unit.id,
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntityId: objectDir.LegalEntity.id,
        fileName,
        createdBy: tgUserId,
        number: 0,
        urgencyId: urgencyRecord.id,
        directoryCategoryId,
    });
    request.Object = objectDir;
    request.Unit = objectDir.Unit;
    request.LegalEntity = objectDir.LegalEntity;

    if (directoryCategoryId) await updateDirectoryCategoryBuilder(request.id, directoryCategoryId);

    sendMsg({
        msg: {
            requestId: request.id,
            customer: request.createdBy,
        },
        event: 'REQUEST_CREATE',
    } as WsMsgData);
    return new RequestDto(request);
};

const createRequestWithoutPhoto = async (
    objectId: string,
    problemDescription: string | undefined,
    urgency: string,
    repairPrice: number | undefined,
    comment: string | undefined,
    tgUserId: string,
    directoryCategoryId: string | undefined
): Promise<RequestDto> => {
    const objectDir = await objectService.getObjectById(objectId);
    if (!objectDir) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    if (!objectDir.Unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit');
    if (!objectDir.LegalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found LegalEntity');

    const request = await RepairRequest.create({
        unitId: objectDir.Unit.id,
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntityId: objectDir.LegalEntity.id,
        fileName: null,
        createdBy: tgUserId,
        number: 0,
        directoryCategoryId: directoryCategoryId ? directoryCategoryId : null,
    });

    request.Object = objectDir;
    request.Unit = objectDir.Unit;
    request.LegalEntity = objectDir.LegalEntity;

    if (directoryCategoryId) await updateDirectoryCategoryBuilder(request.id, directoryCategoryId);

    sendMsg({
        msg: {
            requestId: request.id,
            customer: request.createdBy,
        },
        event: 'REQUEST_CREATE',
    } as WsMsgData);

    return new RequestDto(request);
};

const createRequestWithMultiplePhotos = async (
    objectId: string,
    problemDescription: string | undefined,
    urgency: string,
    repairPrice: number | undefined,
    comment: string | undefined,
    fileNames: string[],
    tgUserId: string,
    directoryCategoryId: string | undefined
): Promise<RequestDto> => {
    const objectDir = await objectService.getObjectById(objectId);
    if (!objectDir) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    if (!objectDir.Unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit');
    if (!objectDir.LegalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found LegalEntity');

    const request = await RepairRequest.create({
        unitId: objectDir.Unit.id,
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntityId: objectDir.LegalEntity.id,
        fileName: fileNames.length > 1 ? JSON.stringify(fileNames) : fileNames[0],
        commentAttachment: null,
        createdBy: tgUserId,
        number: 0,
        directoryCategoryId: directoryCategoryId ? directoryCategoryId : null,
    });

    request.Object = objectDir;
    request.Unit = objectDir.Unit;
    request.LegalEntity = objectDir.LegalEntity;

    if (directoryCategoryId) await updateDirectoryCategoryBuilder(request.id, directoryCategoryId);

    sendMsg({
        msg: {
            requestId: request.id,
            customer: request.createdBy,
        },
        event: 'REQUEST_CREATE',
    } as WsMsgData);

    return new RequestDto(request);
};

const setContractor = async (requestId: string, contractorId: string, managerId?: string): Promise<void> => {
    try {
        const request = await RepairRequest.findByPk(requestId);
        if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
        const oldStatus = request.status;

        // Обработка случая с менеджером как исполнителем
        if (managerId) {
            logger.info(`Setting manager/admin with ID: ${managerId} for request: ${requestId}`);

            let manager = null;

            // First, try to find a TgUser (manager) with this ID
            try {
                manager = await TgUser.findByPk(managerId);
                if (manager) {
                    logger.info(`Found manager as TgUser: ${manager.name}, tgId: ${manager.tgId}`);
                }
            } catch (error) {
                logger.error(`Error looking up TgUser manager: ${error}`);
            }

            if (manager) {
                await request.update({
                    managerId: managerId,
                    managerTgId: manager.tgId,
                    status: 2,
                    daysAtWork: 1,
                    contractorId: null,
                    extContractorId: null,
                    isExternal: false,
                    builder: `Менеджер: ${manager.name}`,
                });

                logger.info(
                    `Заявка ${requestId} назначена менеджеру ${manager.name}, установлены поля: managerId=${managerId}, managerTgId=${manager.tgId}`
                );

                const customer = await TgUser.findByPk(request.createdBy);

                sendMsg({
                    msg: {
                        newStatus: 2,
                        oldStatus: oldStatus,
                        requestId: requestId,
                        contractor: null,
                        customer: customer ? customer.tgId : null,
                        tgUser: manager.tgId,
                    },
                    event: 'STATUS_UPDATE',
                } as WsMsgData);

                return;
            }
        }

        // Обработка "Внешний подрядчик"
        if (
            contractorId &&
            typeof contractorId === 'string' &&
            (contractorId.toLowerCase() === 'внешний подрядчик' ||
                contractorId.toLowerCase() === 'external contractor' ||
                contractorId === 'external')
        ) {
            logger.info(`Setting external contractor for request: ${requestId}`);

            await request.update({
                contractorId: null,
                managerId: null,
                managerTgId: null,
                builder: 'Внешний подрядчик',
                isExternal: true,
                status: 2,
                daysAtWork: 1,
                ExtContractorId: null,
            });

            const customer = await TgUser.findByPk(request.createdBy);

            sendMsg({
                msg: {
                    newStatus: 2,
                    oldStatus: oldStatus,
                    requestId: requestId,
                    contractor: null,
                    customer: customer ? customer.tgId : null,
                },
                event: 'STATUS_UPDATE',
            } as WsMsgData);

            return;
        }

        // Проверяем существование подрядчика с переданным ID
        if (contractorId) {
            try {
                const contractor = await Contractor.findByPk(contractorId);
                if (!contractor) {
                    logger.error(`Contractor with ID ${contractorId} not found`);
                    throw new ApiError(httpStatus.BAD_REQUEST, `Contractor with ID ${contractorId} not found`);
                }

                logger.info(`Setting contractor ${contractor.name} (ID: ${contractorId}) for request: ${requestId}`);

                await request.update({
                    contractorId,
                    managerId: null,
                    managerTgId: null,
                    builder: 'Внутренний сотрудник',
                    status: 2,
                    daysAtWork: 1,
                    extContractorId: null,
                    isExternal: false,
                });

                const customer = await TgUser.findByPk(request.createdBy);
                const tgContractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });

                sendMsg({
                    msg: {
                        newStatus: 2,
                        oldStatus: oldStatus,
                        requestId: requestId,
                        contractor: tgContractor ? (tgContractor.TgUser ? tgContractor.TgUser.tgId : null) : null,
                        customer: customer ? customer.tgId : null,
                    },
                    event: 'STATUS_UPDATE',
                } as WsMsgData);
            } catch (error) {
                logger.error(`Error while setting contractor for request ${requestId}: ${error}`);
                throw error;
            }
        } else {
            // Если contractorId не передан, но и managerId тоже нет
            logger.error('Neither contractor ID nor manager ID was provided');
            throw new ApiError(httpStatus.BAD_REQUEST, 'Either contractor ID or manager ID must be provided');
        }
    } catch (error) {
        logger.error(`Error in setContractor for request ${requestId}: ${error}`);
        throw error;
    }
};

const setExtContractor = async (requestId: string, extContractorId: string): Promise<void> => {
    try {
        logger.info(`Setting external contractor ${extContractorId} for request ${requestId}`);

        // Находим заявку
        const request = await RepairRequest.findByPk(requestId);
        if (!request) {
            logger.error(`Request with id ${requestId} not found`);
            throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
        }

        // Находим внешнего подрядчика
        const extContractor = await ExtContractor.findByPk(extContractorId);
        if (!extContractor) {
            logger.error(`External contractor with id ${extContractorId} not found`);
            throw new ApiError(httpStatus.BAD_REQUEST, 'Not found external contractor');
        }

        const oldStatus = request.status;

        // Обновляем заявку
        logger.info(`Updating request ${requestId} with external contractor ${extContractor.name}`);
        await request.update({
            extContractorId: extContractorId,
            contractorId: null,
            managerId: null,
            managerTgId: null,
            status: 2,
            daysAtWork: 1,
            builder: extContractor.name,
            isExternal: true,
        });

        // Находим заказчика для отправки уведомления
        const customer = await TgUser.findByPk(request.createdBy);

        // Отправляем уведомление
        sendMsg({
            msg: {
                newStatus: 2,
                oldStatus: oldStatus,
                requestId: requestId,
                contractor: null,
                customer: customer ? customer.tgId : null,
            },
            event: 'STATUS_UPDATE',
        } as WsMsgData);

        logger.info(`Successfully set external contractor ${extContractor.name} for request ${requestId}`);
    } catch (error) {
        logger.error(`Error in setExtContractor for request ${requestId}: ${error}`);
        throw error;
    }
};

const setComment = async (requestId: string, comment: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    const customer = await TgUser.findByPk(request.createdBy);
    const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
    sendMsg({
        msg: {
            newComment: comment,
            oldComment: request.comment,
            requestId: requestId,
            contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
            customer: customer ? customer.tgId : null,
        },
        event: 'COMMENT_UPDATE',
    } as WsMsgData);
    await request.update({ comment });
};

const setCommentAttachment = async (requestId: string, filename: string): Promise<RequestDto> => {
    const request = await RepairRequest.findByPk(requestId, {
        include: [
            { model: Unit },
            { model: ObjectDir },
            { model: LegalEntity },
            { model: Contractor },
            { model: ExtContractor },
            { model: DirectoryCategory },
        ],
    });

    if (!request) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest with id ' + requestId);
    }

    const currentFiles = normalizeFileNames(request.fileName);

    const updatedFiles = [...currentFiles, filename];
    await request.update({
        fileName: updatedFiles.length >= 5 ? JSON.stringify(currentFiles) : JSON.stringify(updatedFiles),
    });

    return new RequestDto(request);
};

const removeContractor = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({
        contractorId: null,
        builder: 'Укажите подрядчика',
        isExternal: false,
        extContractorId: null,
    });
};

const removeExtContractor = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({ extContractorId: null, isExternal: false, builder: 'Укажите подрядчика' });
};

const setStatus = async (requestId: string, status: number, statusId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    const customer = await TgUser.findByPk(request.createdBy);
    const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
    sendMsg({
        msg: {
            newStatus: status,
            oldStatus: request.status,
            requestId: requestId,
            contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
            customer: customer ? customer.tgId : null,
        },
        event: 'STATUS_UPDATE',
    } as WsMsgData);
    const dateNow = new Date();
    await request.update({
        status,
        statusId,
        completeDate: status === 3 ? dateNow : null,
        daysAtWork:
            status === 3
                ? Math.floor((dateNow.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : undefined,
        exitDate: status === 5 ? dateNow : null,
    });
};

const updateDirectoryCategoryBuilder = async (requestId: string, directoryCategoryId: string) => {
    const autoSetting = await Settings.findOne({ where: { setting: 'is_auto_set_category' } });
    if (!autoSetting) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found is_auto_set_category');
    if (!autoSetting?.value) return;
    const directoryCategory = await DirectoryCategory.findByPk(directoryCategoryId);
    if (!directoryCategory) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found directoryCategory');

    if (!directoryCategory.isExternal && directoryCategory.builderId) {
        return await setContractor(requestId, directoryCategory.builderId);
    }

    if (directoryCategory.isExternal && directoryCategory.builderExternalId) {
        return await setExtContractor(requestId, directoryCategory.builderExternalId);
    }

    if (directoryCategory.isManager && directoryCategory.managerId) {
        return await setManager(requestId, directoryCategory.managerId);
    }
};

const setNewDirectoryCategory = async (requestId: string, directoryCategoryId: string) => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');

    await updateDirectoryCategoryBuilder(requestId, directoryCategoryId);

    await request.update({ directoryCategoryId });
};

const deleteRequest = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.destroy({ force: true });
};

const update = async (
    requestId: string,
    objectId: string | undefined,
    problemDescription: string | undefined,
    urgency: string | undefined,
    repairPrice: number | undefined,
    comment: string | undefined,
    itineraryOrder: number | undefined,
    contractorId: string | undefined,
    status: number | undefined,
    builder: string | undefined,
    planCompleteDate: Date | null | undefined,
    urgencyId: string | null | undefined,
    managerTgId: string | undefined
): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found request with id ' + requestId);

    logger.info({
        level: 'info',
        message: `Updating repair request ${requestId}`,
        fields: {
            originalManagerTgId: request.managerTgId,
            newManagerTgId: managerTgId,
            originalManagerId: request.managerId,
        },
    });

    const updateData: any = {};

    if (objectId) updateData.objectId = objectId;
    if (problemDescription !== undefined) updateData.problemDescription = problemDescription;
    if (urgency) updateData.urgency = urgency;
    if (repairPrice !== undefined) updateData.repairPrice = repairPrice;
    if (comment !== undefined) updateData.comment = comment;
    if (itineraryOrder !== undefined) updateData.itineraryOrder = itineraryOrder;
    if (contractorId !== undefined) updateData.contractorId = contractorId;
    if (status !== undefined) updateData.status = status;
    if (builder !== undefined) updateData.builder = builder;
    if (planCompleteDate !== undefined) updateData.planCompleteDate = planCompleteDate;
    if (managerTgId !== undefined) updateData.managerTgId = managerTgId;

    await request.update(updateData);

    // Если статус обновлен на "выполнено", устанавливаем дату завершения
    if (status === 3) {
        const dateNow = new Date();
        await request.update({
            completeDate: dateNow,
            daysAtWork: Math.floor((dateNow.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24)),
        });
    }

    // ws section
    if (typeof status !== 'undefined' && status !== request.status) {
        const customer = await TgUser.findByPk(request.createdBy);
        const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
        sendMsg({
            msg: {
                newStatus: status,
                oldStatus: request.status,
                requestId: requestId,
                contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
                customer: customer ? customer.tgId : null,
            },
            event: 'STATUS_UPDATE',
        } as WsMsgData);
    }

    if (typeof urgency !== 'undefined' && urgency !== request.urgency) {
        const customer = await TgUser.findByPk(request.createdBy);
        const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
        sendMsg({
            msg: {
                newUrgency: urgency,
                oldUrgency: request.urgency,
                requestId: requestId,
                contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
                customer: customer ? customer.tgId : null,
            },
            event: 'URGENCY_UPDATE',
        } as WsMsgData);
    }

    if (typeof comment !== 'undefined' && comment !== request.comment) {
        const customer = await TgUser.findByPk(request.createdBy);
        const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
        sendMsg({
            msg: {
                newComment: comment,
                oldComment: request.comment,
                requestId: requestId,
                contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
                customer: customer ? customer.tgId : null,
            },
            event: 'COMMENT_UPDATE',
        } as WsMsgData);
    }

    // Получаем objectDir только если objectId передан
    let unitId, legalEntityId;
    if (objectId) {
        const objectDir = await objectService.getObjectById(objectId);
        unitId = objectDir?.Unit?.id;
        legalEntityId = objectDir?.LegalEntity?.id;
    }
    await RepairRequest.update(
        {
            objectId,
            problemDescription,
            unitId,
            legalEntityId,
            urgency,
            repairPrice,
            comment,
            contractorId,
            status,
            builder: typeof contractorId !== 'undefined' && contractorId ? 'Внутренний сотрудник' : builder,
            completeDate: typeof status !== 'undefined' && status == 3 ? new Date() : null,
            daysAtWork: typeof status !== 'undefined' && status == 2 ? 1 : 0,
            itineraryOrder: urgency && request.urgency === 'Маршрут' && urgency !== 'Маршрут' ? null : itineraryOrder,
            planCompleteDate: urgency && urgency === 'Маршрут' ? new Date() : planCompleteDate,
            urgencyId,
        },
        { where: { id: request.id } }
    );
};

const getCustomersRequests = async (tgUserId: string, filter: any): Promise<RequestDto[]> => {
    let requests;
    const whereParams: any = {};
    Object.keys(filter).forEach((k: any) =>
        k === 'search'
            ? null
            : k !== 'contractor'
              ? (whereParams[k] = filter[k])
              : (whereParams['$Contractor.name$'] = filter[k])
    );

    try {
        const userObjects = await (models.TgUserObject as any).findAll({
            where: { tgUserId },
            attributes: ['objectId'],
        });

        if (!userObjects || userObjects.length === 0) {
            logger.log({
                level: 'info',
                message: `No objects found for tgUser: ${tgUserId}`,
            });
            return [];
        }

        const objectIds = userObjects.map((obj: any) => obj.objectId);

        whereParams.objectId = {
            [Op.in]: objectIds,
        };

        if (Object.keys(filter).length !== 0 && typeof filter.search !== 'undefined') {
            const searchParams: any[] = [
                {
                    status: (() => {
                        return Object.keys(statusesRuLocale)
                            .filter(s =>
                                statusesRuLocale[s as unknown as keyof typeof statusesRuLocale].includes(
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
                searchParams.push({ number: { [Op.eq]: filter.search } });
                searchParams.push({ itineraryOrder: { [Op.eq]: filter.search } });
                searchParams.push({ daysAtWork: { [Op.eq]: filter.search } });
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
                    { model: Contractor },
                    { model: ObjectDir },
                    { model: Unit },
                    { model: LegalEntity },
                    { model: ExtContractor },
                    { model: TgUser },
                    { model: DirectoryCategory },
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
                    { model: TgUser },
                    { model: DirectoryCategory },
                ],
                order: [['number', 'desc']],
            });
        }

        logger.log({
            level: 'info',
            message: `Found ${requests.length} requests for tgUser: ${tgUserId} based on user's objects`,
        });

        return requests.map(r => new RequestDto(r));
    } catch (error) {
        logger.log({
            level: 'error',
            message: `Error getting customer requests for tgUser: ${tgUserId}`,
            error,
        });
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to get customer requests');
    }
};

const addCheck = async (requestId: string, fileName: string): Promise<void> => {
    await RepairRequest.update({ checkPhoto: fileName }, { where: { id: requestId } });
    const status = await Status.findOne({ where: { number: 3 } });
    if (!status) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid status');
    await setStatus(requestId, 3, status.id);
};

const bulkDeleteRequests = async (ids: object): Promise<void> => {
    const repairRequests = await RepairRequest.findAll({ where: { id: ids } });
    if (repairRequests.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found any requests');
    await repairRequests.reduce(
        (chain, request) => chain.then(() => request.destroy({ force: true })),
        Promise.resolve()
    );
};

const bulkSetStatus = async (ids: object, status: number): Promise<void> => {
    const repairRequests = await RepairRequest.findAll({ where: { id: ids } });
    if (repairRequests.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found any requests');
    for (const request of repairRequests) {
        const oldStatus = request.status;
        const dateNow = new Date();
        await request.update({
            status,
            exitDate: status === 5 ? dateNow : null,
            completeDate: status === 3 ? dateNow : null,
        });

        // Отправляем уведомление о смене статуса
        const customer = await TgUser.findByPk(request.createdBy);
        const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
        sendMsg({
            msg: {
                newStatus: status,
                oldStatus: oldStatus,
                requestId: request.id,
                contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
                customer: customer ? customer.tgId : null,
            },
            event: 'STATUS_UPDATE',
        } as WsMsgData);
    }
};

const bulkSetUrgency = async (ids: object, urgency: string): Promise<void> => {
    const repairRequests = await RepairRequest.findAll({ where: { id: ids } });
    if (repairRequests.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found any requests');
    for (const request of repairRequests) {
        const oldUrgency = request.urgency;
        await request.update({ urgency });

        // Отправляем уведомление о смене срочности
        const customer = await TgUser.findByPk(request.createdBy);
        const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
        sendMsg({
            msg: {
                newUrgency: urgency,
                oldUrgency: oldUrgency,
                requestId: request.id,
                contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
                customer: customer ? customer.tgId : null,
            },
            event: 'URGENCY_UPDATE',
        } as WsMsgData);
    }
};

const bulkSetContractor = async (ids: object, contractorId: string): Promise<void> => {
    const repairRequests = await RepairRequest.findAll({ where: { id: ids } });
    if (repairRequests.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found any requests');
    let contractor;
    if (contractorId.toLowerCase() !== 'внешний подрядчик') contractor = await Contractor.findByPk(contractorId);
    if (!contractor && contractorId.toLowerCase() !== 'внешний подрядчик')
        throw new ApiError(httpStatus.BAD_REQUEST, 'Not found contractor with id ' + contractorId);
    for (const request of repairRequests) {
        const oldStatus = request.status;
        if (contractorId.toLowerCase() === 'внешний подрядчик')
            await request.update({ contractorId: null, builder: 'Внешний подрядчик', isExternal: true });
        else
            await request.update({
                contractorId,
                builder: 'Внутренний сотрудник',
                status: 2,
                daysAtWork: 1,
                ExtContractorId: null,
                isExternal: false,
            });
        const customer = await TgUser.findByPk(request.createdBy);
        const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
        sendMsg({
            msg: {
                newStatus: 2,
                oldStatus: oldStatus,
                requestId: request.id,
                contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
                customer: customer ? customer.tgId : null,
            },
            event: 'STATUS_UPDATE',
        } as WsMsgData);
    }
};

const copyRequest = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found request with id ' + requestId);
    await RepairRequest.create({
        status: request.status,
        problemDescription: request.problemDescription,
        urgency: request.urgency,
        planCompleteDate: request.planCompleteDate,
        repairPrice: request.repairPrice,
        comment: request.comment,
        commentAttachment: request.commentAttachment,
        daysAtWork: request.daysAtWork,
        fileName: request.fileName,
        checkPhoto: request.checkPhoto,
        createdAt: request.createdAt,
        createdBy: request.createdBy,
        unitId: request.unitId,
        objectId: request.objectId,
        legalEntityId: request.legalEntityId,
        copiedRequestId: request.id,
        number: 0,
    });
};

const getRequestsByObjects = async (tgUserId: string, filter: any): Promise<RequestDto[]> => {
    return getCustomersRequests(tgUserId, filter);
};

// New function to set a manager as the executor
const setManager = async (requestId: string, managerId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');

    const oldStatus = request.status;

    // Find the manager
    const manager = await TgUser.findByPk(managerId);
    if (!manager) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found manager with id ' + managerId);

    logger.info(
        `Назначение менеджера ${manager.name} (ID: ${managerId}, tgId: ${manager.tgId}) исполнителем для заявки: ${requestId}`
    );

    // Update the request with both managerId and managerTgId
    await request.update({
        managerId,
        managerTgId: manager.tgId, // Store tgId for direct reference in bot
        status: 2,
        daysAtWork: 1,
        contractorId: null,
        ExtContractorId: null,
        isExternal: false,
        builder: `Менеджер: ${manager.name}`,
    });

    logger.info(
        `Заявка ${requestId} успешно обновлена, установлены поля: managerId=${managerId}, managerTgId=${manager.tgId}`
    );

    // Send notification
    const customer = await TgUser.findByPk(request.createdBy);

    sendMsg({
        msg: {
            newStatus: 2,
            oldStatus: oldStatus,
            requestId: requestId,
            contractor: null,
            customer: customer ? customer.tgId : null,
            tgUser: manager.tgId,
        },
        event: 'STATUS_UPDATE',
    } as WsMsgData);
};

const changeUrgency = async (prevName: string, urgencyId: string) => {
    const urgency = await Urgency.findByPk(urgencyId);
    if (!urgency) throw new Error(`Urgency with id ${urgencyId} not found`);

    // Обновить все заявки, где старое имя совпадает
    await RepairRequest.update(
        {
            urgency: urgency.name, // обновляем текстовое имя
            urgencyId: urgency.id, // присваиваем новый ID срочности
        },
        {
            where: { urgency: prevName }, // по совпадению старого текста
        }
    );
};

const changeStatus = async (prevNumber: number, statusId: string) => {
    const status = await Status.findByPk(statusId);
    if (!status) throw new Error(`Status with id ${statusId} not found`);

    // Обновить все заявки, где старый номер совпадает
    await RepairRequest.update(
        {
            status: status.number, // обновляем номер статуса
            statusId: status.id, // присваиваем новый ID срочности
        },
        {
            where: { status: prevNumber }, // по совпадению старого номера
        }
    );
};

const countOfRepairRequest = async (repairId: string) => {
    const request = await RepairRequest.findByPk(repairId);
    if (!request) throw new Error(`Repair Request with id ${repairId} not found`);
    const currentFiles = normalizeFileNames(request.fileName);
    return currentFiles.length;
};

// Поиск актуальных заявок по объектам  - 1, 2 и 5 статусы
export const getActualRequestsByObjectId = async (tgUserId: string, unitId: string, objectId?: string) => {
    const actualStatuses = [1, 2, 5];

    const unitObjects = await ObjectDir.findAll({
        where: { unitId },
        attributes: ['id'],
    });
    const unitObjectIds = unitObjects.map(uo => uo.id);

    let userObjectIds: string[] = [];
    if (tgUserId) {
        const usersObjects = await TgUserObject.findAll({
            where: { tgUserId },
            attributes: ['objectId'],
        });
        userObjectIds = usersObjects.map(uo => uo.objectId);

        userObjectIds = userObjectIds.filter(id => unitObjectIds.includes(id));
    }

    const whereClause: any = {
        status: { [Op.in]: actualStatuses },
    };

    if (tgUserId) {
        if (objectId) {
            if (userObjectIds.includes(objectId)) {
                whereClause.objectId = objectId;
            } else {
                return [];
            }
        } else {
            whereClause.objectId = { [Op.in]: userObjectIds };
        }
    } else {
        if (objectId) {
            whereClause.objectId = objectId;
        } else {
            whereClause.objectId = { [Op.in]: unitObjectIds };
        }
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
    getAllRequests,
    getRequestById,
    createRequest,
    createRequestWithoutPhoto,
    createRequestWithMultiplePhotos,
    setContractor,
    setExtContractor,
    setComment,
    setCommentAttachment,
    removeContractor,
    removeExtContractor,
    setStatus,
    deleteRequest,
    update,
    getCustomersRequests,
    getRequestsByObjects,
    addCheck,
    bulkDeleteRequests,
    bulkSetStatus,
    bulkSetUrgency,
    bulkSetContractor,
    copyRequest,
    changeUrgency,
    setManager,
    changeStatus,
    countOfRepairRequest,
    setNewDirectoryCategory,
    getActualRequestsByObjectId,
};
