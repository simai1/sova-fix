import RepairRequest from '../models/repairRequest';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';

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
    legalEntity: string | undefined
): Promise<RequestDto> => {
    const request = await RepairRequest.create({
        unit,
        object,
        problemDescription,
        urgency,
        repairPrice,
        comment,
        legalEntity,
        number: 0,
    });
    return new RequestDto(request);
};

export default {
    getAllRequests,
    createRequest,
};
