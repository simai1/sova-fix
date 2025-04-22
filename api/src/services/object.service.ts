import ObjectDir from '../models/object';
import ObjectDto from '../dtos/object.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Unit from '../models/unit';
import LegalEntity from '../models/legalEntity';
import legalEntityService from './legalEntity.service';
import unitService from './unit.service';
import { sendMsg, WsMsgData } from '../utils/ws';
import { models } from '../models';
import logger from '../utils/logger';

const getObjectById = async (id: string): Promise<ObjectDir | null> => {
    return await ObjectDir.findByPk(id, { include: [{ model: Unit }, { model: LegalEntity }] });
};

const getAllObjects = async (): Promise<ObjectDto[]> => {
    const objects = await ObjectDir.findAll({
        include: [{ model: Unit }, { model: LegalEntity }],
        order: [['number', 'ASC']],
    });
    return objects.map(o => new ObjectDto(o));
};

/**
 * Получает объекты, доступные конкретному пользователю Telegram
 * @param tgUserId ID пользователя Telegram
 * @returns Массив объектов, доступных пользователю
 */
const getUserObjects = async (tgUserId: string): Promise<ObjectDto[]> => {
    try {
        logger.log({
            level: 'info',
            message: `Getting objects for user ${tgUserId} from object service`,
        });

        // Получаем связи пользователя с объектами из таблицы tgUserObjects
        const userObjectRelations = await (models.TgUserObject as any).findAll({
            where: { tgUserId },
            include: [
                {
                    model: models.ObjectDir,
                    as: 'Object',
                    required: true,
                    include: [{ model: Unit }, { model: LegalEntity }]
                },
            ],
        });

        logger.log({
            level: 'info',
            message: `Found ${userObjectRelations.length} relations with objects for user ${tgUserId}`,
        });

        // Извлекаем только объекты из связей
        const objects = userObjectRelations
            .map((relation: any) => relation.Object)
            .filter((object: any) => object !== null && object !== undefined);

        logger.log({
            level: 'info',
            message: `Final objects list for user ${tgUserId}: ${objects.length} items`,
        });

        // Преобразуем объекты в DTO и возвращаем
        return objects.map((obj: any) => new ObjectDto(obj));
    } catch (error) {
        logger.log({
            level: 'error',
            message: `Error getting user objects: ${error}`,
            error,
        });

        throw new ApiError(
            httpStatus.INTERNAL_SERVER_ERROR,
            `Failed to get objects for user ${tgUserId}`
        );
    }
};

const createObject = async (name: string, unitId: string, city: string, legalEntityId: string): Promise<ObjectDto> => {
    const checkObject = await ObjectDir.findOne({ where: { name } });
    if (checkObject) throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists object');
    const legalEntity = await LegalEntity.findByPk(legalEntityId);
    if (!legalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found legalEntity with id ' + legalEntityId);
    const unit = await Unit.findByPk(unitId);
    if (!unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    const objectDir = await ObjectDir.create({ name, unitId, city, number: 1, legalEntityId });
    await legalEntityService.setCountLegalEntity(legalEntityId);
    await unitService.setCountUnit(unitId);
    sendMsg({
        msg: {
            objectName: name,
        },
        event: 'OBJECT_CREATE',
    } as WsMsgData);
    objectDir.LegalEntity = legalEntity;
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
    await objectDir.destroy({ force: true });
    if (objectDir.legalEntityId) await legalEntityService.setCountLegalEntity(objectDir.legalEntityId);
    if (objectDir.unitId) await unitService.setCountUnit(objectDir.unitId);
};

const updateObject = async (
    objectId: string,
    name: string | undefined,
    unitId: string | undefined,
    city: string | undefined,
    legalEntityId: string | undefined
): Promise<void> => {
    const checkObject = await getObjectById(objectId);
    if (!checkObject) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found object with id ' + objectId);
    if (unitId) {
        const unit = await Unit.findByPk(unitId);
        if (!unit) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found unit with id ' + unitId);
    }
    if (legalEntityId) {
        const legalEntity = await LegalEntity.findByPk(legalEntityId);
        if (!legalEntity) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found legalEntity with id ' + legalEntity);
    }
    await checkObject.update({ name, unitId, city, legalEntityId });
    if (legalEntityId) await legalEntityService.setCountLegalEntity(legalEntityId);
    if (unitId) await unitService.setCountUnit(unitId);
};

export default {
    getObjectById,
    getAllObjects,
    getUserObjects,
    createObject,
    getOneObject,
    destroyObject,
    updateObject,
};
