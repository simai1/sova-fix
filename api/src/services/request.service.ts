import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import contractorService from './contractor.service';
import { Op } from 'sequelize';
import { statusesRuLocale } from '../config/statuses';
import sequelize from 'sequelize';

const getAllRequests = async (filter: any): Promise<RequestDto[]> => {
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
        requests = await RepairRequest.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { number: Number.isInteger(filter.search) ? parseInt(filter.search) : null },
                            {
                                status: (() => {
                                    return Object.keys(statusesRuLocale)
                                        .filter(s =>
                                            // @ts-expect-error skip
                                            statusesRuLocale[s].includes(
                                                Number.isInteger(filter.search)
                                                    ? filter.search
                                                    : filter.search.toLowerCase()
                                            )
                                        )
                                        .map(s => s);
                                })(),
                            },
                            { unit: { [Op.iLike]: `%${filter.search}%` } },
                            { builder: { [Op.iLike]: `%${filter.search}%` } },
                            { object: { [Op.iLike]: `%${filter.search}%` } },
                            { problemDescription: { [Op.like]: `%${filter.search}%` } },
                            { urgency: { [Op.iLike]: `%${filter.search}%` } },
                            {
                                itineraryOrder: Number.isInteger(filter.search) ? filter.search : null,
                            },
                            sequelize.where(sequelize.cast(sequelize.col('repair_price'), 'varchar'), {
                                [Op.iLike]: `%${filter.search}%`,
                            }),
                            { comment: { [Op.iLike]: `%${filter.search}%` } },
                            { legalEntity: { [Op.iLike]: `%${filter.search}%` } },
                            { daysAtWork: Number.isInteger(filter.search) ? filter.search : null },
                            { '$Contractor.name$': { [Op.iLike]: `%${filter.search}%` } },
                        ],
                    },
                    whereParams,
                ],
            },
            include: [
                {
                    model: Contractor,
                },
            ],
            order: [['number', 'asc']],
        });
    } else {
        requests = await RepairRequest.findAll({
            where: whereParams,
            include: [{ model: Contractor }],
            order: [['number', 'asc']],
        });
    }
    return requests.map(request => new RequestDto(request));
};

const getRequestById = async (requestId: string): Promise<RequestDto> => {
    const request = await RepairRequest.findByPk(requestId, { include: [{ model: Contractor }] });
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    return new RequestDto(request);
};

const createRequest = async (
    unit: string,
    object: string,
    problemDescription: string | undefined,
    urgency: string,
    repairPrice: number | undefined,
    comment: string | undefined,
    legalEntity: string | undefined,
    fileName: string
): Promise<RequestDto> => {
    const request = await RepairRequest.create({
        unit,
        object,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntity,
        fileName,
        number: 0,
    });
    return new RequestDto(request);
};

const setContractor = async (requestId: string, contractorId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({ contractorId, builder: 'Внутренний сотрудник' });
};

const removeContractor = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({ contractorId: null, builder: 'Укажите подрядчика' });
};

const setStatus = async (requestId: string, status: number): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({
        status,
        completeDate: status === 3 ? new Date() : null,
        daysAtWork: status === 2 ? 1 : 0,
    });
};

const deleteRequest = async (requestId: string): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.destroy({ force: true });
};

const update = async (
    requestId: string,
    unit: string | undefined,
    object: string | undefined,
    problemDescription: string | undefined,
    urgency: string | undefined,
    repairPrice: number | undefined,
    comment: string | undefined,
    legalEntity: string | undefined,
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

    await RepairRequest.update(
        {
            unit,
            object,
            problemDescription,
            urgency,
            repairPrice,
            comment,
            legalEntity,
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

export default {
    getAllRequests,
    getRequestById,
    createRequest,
    setContractor,
    removeContractor,
    setStatus,
    deleteRequest,
    update,
};
