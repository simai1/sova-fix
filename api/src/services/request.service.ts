import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import contractorService from './contractor.service';
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

const getAllRequests = async (filter: any, order: any): Promise<RequestDto[]> => {
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
            order:
                order.col && order.type
                    ? order.col === 'contractor'
                        ? [['Contractor', 'name', order.type]]
                        : [[order.col, order.type]]
                    : [['number', 'desc']],
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
        });
    }

    return requests.map(request => new RequestDto(request));
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
    planCompleteDate: Date | null | undefined
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
        },
        { where: { id: request.id } }
    );
};

const getCustomersRequests = async (tgUserId: string, filter: any): Promise<RequestDto[]> => {
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
    // @ts-expect-error skip
    whereParams['createdBy'] = tgUserId;
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
    return requests.map(r => new RequestDto(r));
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

export default {
    getAllRequests,
    getRequestById,
    createRequest,
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
    addCheck,
    bulkDeleteRequests,
    bulkSetStatus,
    bulkSetUrgency,
    bulkSetContractor,
};
