import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import LegalEntity from '../models/legalEntity';
import LegalEntityDto from '../dtos/legalEntity.dto';

const getLegalEntityById = async (id: string): Promise<LegalEntity | null> => {
    return await LegalEntity.findByPk(id);
};

const getAllLegalEntities = async (): Promise<LegalEntityDto[]> => {
    const legalEntities = await LegalEntity.findAll();
    return legalEntities.map(le => new LegalEntityDto(le));
};

const createLegalEntity = async (name: string, legalForm: string, startCoop: string): Promise<LegalEntityDto> => {
    const startCoopDate = new Date(startCoop);
    const checkLegalEntity = await LegalEntity.findOne({ where: { name } });
    if (checkLegalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists legal entity');
    const legalEntity = await LegalEntity.create({ name, legalForm, startCoop: startCoopDate, number: 1 }, {});
    return new LegalEntityDto(legalEntity);
};

const getOneLegalEntity = async (legalEntityId: string): Promise<LegalEntityDto> => {
    const legalEntity = await getLegalEntityById(legalEntityId);
    if (!legalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found legal entity with id ' + legalEntityId);
    return new LegalEntityDto(legalEntity);
};

const destroyLegalEntity = async (legalEntityId: string): Promise<void> => {
    const legalEntity = await getLegalEntityById(legalEntityId);
    if (!legalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found legal entity with id ' + legalEntityId);
    await legalEntity.destroy({ force: true });
};

const updateLegalEntity = async (
    legalEntityId: string,
    name: string | undefined,
    legalForm: string | undefined,
    startCoop: string | undefined
): Promise<LegalEntityDto> => {
    let startCoopDate;
    if (startCoop) startCoopDate = new Date(startCoop);
    const checkLegalEntity = await getLegalEntityById(legalEntityId);
    if (!checkLegalEntity)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Not found legal entity with id ' + legalEntityId);
    const unit = await checkLegalEntity.update({ name, legalForm, startCoop: startCoopDate });
    return new LegalEntityDto(unit);
};

export default {
    getLegalEntityById,
    getAllLegalEntities,
    createLegalEntity,
    getOneLegalEntity,
    destroyLegalEntity,
    updateLegalEntity,
};
