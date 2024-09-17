import ObjectDir from '../models/object';
import ObjectDto from '../dtos/object.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Unit from '../models/unit';

const getObjectById = async (id: string): Promise<ObjectDir | null> => {
    return await ObjectDir.findByPk(id, { include: [{ model: Unit }] });
};

const getAllObjects = async (): Promise<ObjectDto[]> => {
    const objects = await ObjectDir.findAll({ include: [{ model: Unit }] });
    return objects.map(o => new ObjectDto(o));
};

const createObject = async (name: string, unitId: string): Promise<ObjectDto> => {
    const checkObject = await ObjectDir.findOne({ where: { name } });
    if (checkObject) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists object');
    const unit = await Unit.findByPk(unitId);
    if (!unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    const objectDir = await ObjectDir.create({ name, unitId, number: 1 });
    objectDir.Unit = unit;
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

const updateObject = async (objectId: string, name: string | undefined, unitId: string | undefined): Promise<void> => {
    const checkObject = await getObjectById(objectId);
    if (!checkObject) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    if (unitId) {
        const unit = await Unit.findByPk(unitId);
        if (!unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    }
    await checkObject.update({ name, unitId });
};

export default {
    getObjectById,
    getAllObjects,
    createObject,
    getOneObject,
    destroyObject,
    updateObject,
};
