import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getAllRequests = async (): Promise<RequestDto[]> => {
    const requests = await RepairRequest.findAll({ include: [{ model: Contractor }], order: [['number', 'asc']] });
    return requests.map(request => new RequestDto(request));
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
    await request.update({ contractorId });
};

const setStatus = async (requestId: string, status: number): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await request.update({ status });
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
    itineraryOrder: number | undefined
): Promise<void> => {
    const request = await RepairRequest.findByPk(requestId);
    if (!request) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found repairRequest');
    await RepairRequest.update(
        { unit, object, problemDescription, urgency, repairPrice, comment, legalEntity, itineraryOrder },
        { where: { id: request.id } }
    );
};

export default {
    getAllRequests,
    createRequest,
    setContractor,
    setStatus,
    deleteRequest,
    update,
};
