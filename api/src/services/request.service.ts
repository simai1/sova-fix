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
            { unit: { [Op.iLike]: `%${filter.search}%` } },
            { builder: { [Op.iLike]: `%${filter.search}%` } },
            { object: { [Op.iLike]: `%${filter.search}%` } },
            { problemDescription: { [Op.iLike]: `%${filter.search}%` } },
            { urgency: { [Op.iLike]: `%${filter.search}%` } },
            sequelize.where(sequelize.cast(sequelize.col('repair_price'), 'varchar'), {
                [Op.iLike]: `%${filter.search}%`,
            }),
            { comment: { [Op.iLike]: `%${filter.search}%` } },
            { legalEntity: { [Op.iLike]: `%${filter.search}%` } },
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
    await request.update({ contractorId, builder: 'Внутренний сотрудник', status: 2 });

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
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    const oldStatus = request.status;
    await request.update({ ExtContractorId: extContractorId, contractorId: null, status: 2 });

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

const removeContractor = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({ contractorId: null, builder: 'Укажите подрядчика' });
};

const removeExtContractor = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({ ExtContractorId: null });
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
    await request.update({
        status,
        completeDate: status === 3 ? new Date() : null,
        daysAtWork: status === 2 ? 1 : status === 3 ? undefined : 0,
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
    builder: string | undefined
): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');

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
            urgency,
            repairPrice,
            comment,
            contractorId,
            status,
            builder: typeof contractorId !== 'undefined' && contractorId ? 'Внутренний сотрудник' : builder,
            completeDate: typeof status !== 'undefined' && status == 3 ? new Date() : null,
            daysAtWork: typeof status !== 'undefined' && status == 2 ? 1 : 0,
            itineraryOrder: urgency && request.urgency === 'Маршрут' && urgency !== 'Маршрут' ? null : itineraryOrder,
        },
        { where: { id: request.id } }
    );
};

const getCustomersRequests = async (tgUserId: string): Promise<RequestDto[]> => {
    const requests = await RepairRequest.findAll({
        where: { createdBy: tgUserId },
        include: [
            { model: Contractor },
            { model: ObjectDir },
            { model: Unit },
            { model: LegalEntity },
            { model: ExtContractor },
        ],
    });
    return requests.map(r => new RequestDto(r));
};

const addCheck = async (requestId: string, file: string): Promise<void> => {
    await RepairRequest.update({ checkPhoto: file }, { where: { id: requestId } });
    await setStatus(requestId, 3);
};

export default {
    getAllRequests,
    getRequestById,
    createRequest,
    setContractor,
    setExtContractor,
    setComment,
    removeContractor,
    removeExtContractor,
    setStatus,
    deleteRequest,
    update,
    getCustomersRequests,
    addCheck,
};
