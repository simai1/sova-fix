import httpStatus from 'http-status';
import { UrgencyDto } from '../dtos/urgency.dto';
import Urgency from '../models/urgency';
import ApiError from '../utils/ApiError';
import RepairRequest from '../models/repairRequest';

const createNewUrgency = async (name: string, color: string): Promise<UrgencyDto> => {
    const checkUrgency = await Urgency.findOne({ where: { name } });
    if (checkUrgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists unit');
    const newUrgency = await Urgency.create({ name, color, number: 1 }, {});
    return new UrgencyDto(newUrgency);
};

const getAllUrgencies = async (): Promise<UrgencyDto[]> => {
    const urgencies = await Urgency.findAll({ order: [['number', 'ASC']] });
    return urgencies.map(o => new UrgencyDto(o));
};

const updateUrgency = async (
    urgencyId: string,
    name: string | undefined,
    color: string | undefined
): Promise<UrgencyDto> => {
    const checkUrgency = await Urgency.findByPk(urgencyId);
    if (!checkUrgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + urgencyId);
    if (checkUrgency.name === 'Маршрут' && name !== 'Маршрут')
        throw new ApiError(httpStatus.BAD_REQUEST, 'This urgency cannot be edited');
    const urgency = await checkUrgency.update({ name, color });
    return new UrgencyDto(urgency);
};

const destroyUrgency = async (urgencyId: string) => {
    const urgency = await Urgency.findByPk(urgencyId);
    if (!urgency) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found urgency with id ' + urgencyId);
    if (urgency.name === 'Маршрут') throw new ApiError(httpStatus.BAD_REQUEST, 'This urgency cannot be deleted');

    const relatedRepairs = await RepairRequest.findAll({ where: { urgencyId } });
    if (relatedRepairs.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Нельзя удалить срочность, есть связанные заявки');
    }

    await urgency.destroy({ force: true });
};

export default {
    createNewUrgency,
    getAllUrgencies,
    updateUrgency,
    destroyUrgency,
};
