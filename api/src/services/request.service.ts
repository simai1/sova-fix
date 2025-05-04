import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import contractorService from './contractor.service';
import { Op } from 'sequelize';
import { mapStatusesRuLocale, statusesRuLocale } from '../config/statuses';
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

const getAllRequests = async (filter: any, order: any, pagination: any) => {
    let requests;
    const whereParams: any = {};
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
        } else if (fieldName === 'object') {
            whereParams['$Object.name$'] = isExclusion ? { [Op.notIn]: value } : { [Op.in]: value };
        } else if (fieldName === 'unit') {
            whereParams['$Unit.name$'] = isExclusion ? { [Op.notIn]: value } : { [Op.in]: value };
        } else if (fieldName === 'status') {
            value = value.map((v: any) => {
                // @ts-expect-error any type
                return Number(mapStatusesRuLocale[v.trim()]);
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
};

const getRequestById = async (requestId: string): Promise<RequestDto> => {
    const request = await RepairRequest.findByPk(requestId, {
        include: [
            { model: Contractor },
            { model: ObjectDir },
            { model: Unit },
            { model: LegalEntity },
            { model: ExtContractor },
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
    tgUserId: string
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
    });
    request.Object = objectDir;
    request.Unit = objectDir.Unit;
    request.LegalEntity = objectDir.LegalEntity;
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
    tgUserId: string
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
    });
    
    request.Object = objectDir;
    request.Unit = objectDir.Unit;
    request.LegalEntity = objectDir.LegalEntity;
    
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
    tgUserId: string
): Promise<RequestDto> => {
    const objectDir = await objectService.getObjectById(objectId);
    if (!objectDir) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    if (!objectDir.Unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit');
    if (!objectDir.LegalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found LegalEntity');
    
    const mainPhoto = fileNames[0];
    const additionalPhotos = fileNames.slice(1);
    
    const request = await RepairRequest.create({
        unitId: objectDir.Unit.id,
        objectId,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntityId: objectDir.LegalEntity.id,
        fileName: mainPhoto,
        commentAttachment: additionalPhotos.length > 0 ? JSON.stringify(additionalPhotos) : undefined,
        createdBy: tgUserId,
        number: 0,
    });
    
    request.Object = objectDir;
    request.Unit = objectDir.Unit;
    request.LegalEntity = objectDir.LegalEntity;
    
    sendMsg({
        msg: {
            requestId: request.id,
            customer: request.createdBy,
        },
        event: 'REQUEST_CREATE',
    } as WsMsgData);
    
    return new RequestDto(request);
};

const setContractor = async (requestId: string, contractorId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
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
            requestId: requestId,
            contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
            customer: customer ? customer.tgId : null,
        },
        event: 'STATUS_UPDATE',
    } as WsMsgData);
};

const setExtContractor = async (requestId: string, extContractorId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    const extContractor = await ExtContractor.findByPk(extContractorId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    if (!extContractor) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found external contractor');
    const oldStatus = request.status;
    await request.update({
        ExtContractorId: extContractorId,
        contractorId: null,
        status: 2,
        daysAtWork: 1,
        builder: extContractor.name,
    });

    const customer = await TgUser.findByPk(request.createdBy);
    const contractor = await Contractor.findByPk(request.contractorId, { include: [{ model: TgUser }] });
    sendMsg({
        msg: {
            newStatus: 2,
            oldStatus: oldStatus,
            requestId: requestId,
            contractor: contractor ? (contractor.TgUser ? contractor.TgUser.tgId : null) : null,
            customer: customer ? customer.tgId : null,
        },
        event: 'STATUS_UPDATE',
    } as WsMsgData);
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
        ],
    });
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest with id ' + requestId);
    await request.update({ commentAttachment: filename });
    return new RequestDto(request);
};

const removeContractor = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({
        contractorId: null,
        builder: 'Укажите подрядчика',
        isExternal: false,
        ExtContractorId: null,
    });
};

const removeExtContractor = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({ ExtContractorId: null, isExternal: false, builder: 'Укажите подрядчика' });
};

const setStatus = async (requestId: string, status: number): Promise<void> => {
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
        completeDate: status === 3 ? dateNow : null,
        daysAtWork:
            status === 3
                ? Math.floor((dateNow.getTime() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24))
                : undefined,
    });
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
    urgencyId: string | null | undefined
): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    let objectDir;
    if (objectId) objectDir = await objectService.getObjectById(objectId);

    if (itineraryOrder) {
        const itinerary = await contractorService.getContractorsItinerary(request.contractorId as string, {});
        for (const it of itinerary) {
            if (itineraryOrder === it.itineraryOrder)
                await RepairRequest.update({ itineraryOrder: request.itineraryOrder }, { where: { id: it.id } });
        }
    }

    // ws section
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
    } else if (typeof comment !== 'undefined' && comment !== request.comment) {
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
    await RepairRequest.update(
        {
            objectId,
            problemDescription,
            unitId: objectDir?.Unit?.id,
            legalEntityId: objectDir?.LegalEntity?.id,
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
                searchParams.push({ number: { [Op.eq]: filter.search } } as any);
                searchParams.push({ itineraryOrder: { [Op.eq]: filter.search } } as any);
                searchParams.push({ daysAtWork: { [Op.eq]: filter.search } } as any);
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

const addCheck = async (requestId: string, file: string): Promise<void> => {
    await RepairRequest.update({ checkPhoto: file }, { where: { id: requestId } });
    await setStatus(requestId, 3);
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
        await request.update({ status });
    }
};

const bulkSetUrgency = async (ids: object, urgency: string): Promise<void> => {
    const repairRequests = await RepairRequest.findAll({ where: { id: ids } });
    if (repairRequests.length === 0) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found any requests');
    for (const request of repairRequests) {
        await request.update({ urgency });
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
    logger.log({
        level: 'info',
        message: `Getting requests by objects for tgUser: ${tgUserId}`,
    });
    
    return getCustomersRequests(tgUserId, filter);
};

const changeUrgency = async(prevName: string, urgencyId: string) => {
    const urgency = await Urgency.findByPk(urgencyId);
    if (!urgency) throw new Error(`Urgency with id ${urgencyId} not found`);

    // Обновить все заявки, где старое имя совпадает
    await RepairRequest.update(
        {
            urgency: urgency.name,       // обновляем текстовое имя
            urgencyId: urgency.id,       // присваиваем новый ID срочности
        },
        {
            where: { urgency: prevName } // по совпадению старого текста
        }
    );
}

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
};
