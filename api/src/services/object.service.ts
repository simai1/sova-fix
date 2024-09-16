import ObjectDir from '../models/object';
import ObjectDto from '../dtos/object.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const getObjectById = async (id: string): Promise<ObjectDir | null> => {
    return await ObjectDir.findByPk(id);
};

const getAllObjects = async (): Promise<ObjectDto[]> => {
    const objects = await ObjectDir.findAll();
    return objects.map(o => new ObjectDto(o));
};

const createObject = async (name: string): Promise<ObjectDto> => {
    const checkObject = await ObjectDir.findOne({ where: { name } });
    if (checkObject) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists object');
    const objectDir = await ObjectDir.create({ name });
    return new ObjectDto(objectDir);
};

const getOneObject = async (objectId: string): Promise<ObjectDto> => {
    const objectDir = await getObjectById(objectId);
    if (!objectDir) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    return new ObjectDto(objectDir);
};

const destroyObject = async (objectId: string): Promise<void> => {
    const objectDir = await getObjectById(objectId);
    if (!objectDir) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    await objectDir.destroy();
};

const updateObject = async (objectId: string, name: string): Promise<ObjectDto> => {
    const checkObject = await getObjectById(objectId);
    if (!checkObject) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    const objectDir = await checkObject.update({ name });
    return new ObjectDto(objectDir);
};

export default {
    getObjectById,
    getAllObjects,
    createObject,
    getOneObject,
    destroyObject,
    updateObject,
};
