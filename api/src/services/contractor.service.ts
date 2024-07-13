import ContractorDto from '../dtos/contractor.dto';
import Contractor from '../models/contractor';
import RequestDto from '../dtos/request.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import RepairRequest from '../models/repairRequest';

const getAllContractors = async (): Promise<ContractorDto[]> => {
    const contractors = await Contractor.findAll({ order: [['name', 'asc']] });
    return contractors.map(contractor => new ContractorDto(contractor));
};

const createContractor = async (name: string): Promise<ContractorDto> => {
    const contractor = await Contractor.create({ name });
    return new ContractorDto(contractor);
};

const getOneContractorById = async (id: string): Promise<Contractor | null> => {
    return await Contractor.findByPk(id);
};

const getContractorsRequests = async (id: string): Promise<RequestDto[]> => {
    const contractor = await Contractor.findByPk(id);
    if (!contractor) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found contractor');
    const requests = await RepairRequest.findAll({
        where: { contractorId: contractor.id },
        include: [{ model: Contractor }],
    });
    return requests.map(request => new RequestDto(request));
};

export default {
    getAllContractors,
    createContractor,
    getOneContractorById,
    getContractorsRequests,
};
