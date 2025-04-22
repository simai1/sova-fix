import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import ExtContractor from '../models/externalContractor';
import ExtContractorDto from '../dtos/extContractor.dto';

const getExtContractorById = async (id: string): Promise<ExtContractor | null> => {
    return await ExtContractor.findByPk(id);
};

const getAllExtContractors = async (): Promise<ExtContractorDto[]> => {
    const extContractors = await ExtContractor.findAll();
    return extContractors.map(o => new ExtContractorDto(o));
};

const createExtContractor = async (name: string, spec: string, legalForm: string): Promise<ExtContractorDto> => {
    const checkExtContractor = await ExtContractor.findOne({ where: { name } });
    if (checkExtContractor) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists external contractor');
    const extContractor = await ExtContractor.create({ name, spec, legalForm, number: 1 });
    return new ExtContractorDto(extContractor);
};

const getOneExtContractor = async (extContractorId: string): Promise<ExtContractorDto> => {
    const extContractor = await getExtContractorById(extContractorId);
    if (!extContractor)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Not found external contractor with id ' + extContractorId);
    return new ExtContractorDto(extContractor);
};

const destroyExtContractor = async (extContractorId: string): Promise<void> => {
    const extContractor = await getExtContractorById(extContractorId);
    if (!extContractor)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Not found external contractor with id ' + extContractorId);
    await extContractor.destroy({ force: true });
};

const updateExtContractor = async (
    extContractorId: string,
    name: string | undefined,
    spec: string | undefined,
    legalForm: string | undefined
): Promise<ExtContractorDto> => {
    const checkExtContractor = await getExtContractorById(extContractorId);
    if (!checkExtContractor)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Not found external contractor with id ' + extContractorId);
    const extContractor = await checkExtContractor.update({ name, spec, legalForm });
    return new ExtContractorDto(extContractor);
};

export default {
    getExtContractorById,
    getAllExtContractors,
    createExtContractor,
    getOneExtContractor,
    destroyExtContractor,
    updateExtContractor,
};
