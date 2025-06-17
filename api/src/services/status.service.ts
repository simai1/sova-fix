import httpStatus from 'http-status';
import Status from '../models/status';
import ApiError from '../utils/ApiError';
import { StatusDto } from '../dtos/status.dto';
import RepairRequest from '../models/repairRequest';

const createNewStatus = async (name: string, color: string): Promise<StatusDto> => {
    const checkStatus = await Status.findOne({ where: { name } });
    if (checkStatus) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists unit');
    const newStatus = await Status.create({ name, color, number: 1 }, {});
    return new StatusDto(newStatus);
};

const getAllStatuses = async (): Promise<StatusDto[]> => {
    const statuses = await Status.findAll({ order: [['number', 'ASC']] });
    return statuses.map(o => new StatusDto(o));
};

const updateStatus = async (
    statusId: string,
    name: string | undefined,
    color: string | undefined
): Promise<StatusDto> => {
    const checkStatus = await Status.findByPk(statusId);
    if (!checkStatus) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + statusId);
    if (checkStatus.number < 6 && name !== checkStatus.name)
        throw new ApiError(httpStatus.BAD_REQUEST, 'This status cannot be edited');
    const urgency = await checkStatus.update({ name, color });
    return new StatusDto(urgency);
};

const destroyStatus = async (statusId: string) => {
    const status = await Status.findByPk(statusId);
    if (!status) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found status with id ' + statusId);
    if (status.number < 6) throw new ApiError(httpStatus.BAD_REQUEST, 'This status cannot be deleted');

    const relatedRepairs = await RepairRequest.findAll({ where: { statusId } });
    if (relatedRepairs.length > 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Нельзя удалить статус, есть связанные заявки');
    }

    await status.destroy({ force: true });
};

const getStatusByNumber = async (statusNumber: number) => {
    const status = await Status.findOne({ where: { number: statusNumber } });
    if (!status) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found status with number ' + statusNumber);
    return status;
};

export default {
    createNewStatus,
    getAllStatuses,
    updateStatus,
    destroyStatus,
    getStatusByNumber,
};
