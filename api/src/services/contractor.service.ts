import ContractorDto from '../dtos/contractor.dto';
import Contractor from '../models/contractor';

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

export default {
    getAllContractors,
    createContractor,
    getOneContractorById,
};
