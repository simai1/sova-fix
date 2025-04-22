import TgUserDto from '../dtos/tgUser.dto';
import TgUser from '../models/tgUser';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import Contractor from '../models/contractor';
import userService from './user.service';
import { isMatch } from '../utils/encryption';
import User from '../models/user';
import { sendMsg, WsMsgData } from '../utils/ws';
import { Op } from 'sequelize';
import logger from '../utils/logger';
import { models } from '../models';
import TgUserObject from '../models/tgUserObject';

const create = async (name: string, role: number, tgId: string, linkId: string | undefined): Promise<TgUserDto> => {
    role = parseInt(String(role));
    const checkUser = await findUserByTgId(tgId);
    if (checkUser) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Already exists tgUser');
    }
    logger.log({
        level: 'info',
        message: `User registered: ${name}`,
    });
    const user = await TgUser.create({ name, role, tgId, linkId });
    if (role === 4) {
        user.Contractor = await Contractor.create({ name, tgUserId: user.id });
    }
    await user.save();
    sendMsg({
        msg: {
            userId: user.id,
            tgId: tgId,
        },
        event: 'TGUSER_CREATE',
    } as WsMsgData);
    return new TgUserDto(user);
};

const syncManagerToTgUser = async (
    email: string,
    password: string,
    name: string,
    tgId: string,
    linkId: string | undefined
): Promise<TgUserDto> => {
    const user = await userService.getUserByEmail(email);
    if (!user || !(await isMatch(password, user.password)))
        throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid login data');
    const tgUser = await TgUser.create({ name, role: 2, isConfirmed: true, tgId, linkId });
    await user.update({ isTgUser: true, tgManagerId: tgUser.id });
    tgUser.User = user;
    await tgUser.save();
    return new TgUserDto(tgUser);
};

const findUserByTgId = async (tgId: string): Promise<TgUserDto | null> => {
    const user = await TgUser.findOne({ where: { tgId }, include: [{ model: Contractor }, { model: User }] });
    return user ? new TgUserDto(user) : null;
};

const getAll = async (): Promise<TgUserDto[]> => {
    const users = await TgUser.findAll({ include: [{ model: Contractor }, { model: User }] });
    return users.map(user => new TgUserDto(user));
};

const getAllManagers = async (): Promise<TgUserDto[]> => {
    const users = await User.findAll({ where: { tgManagerId: { [Op.ne]: null } }, include: [{ model: TgUser }] });
    return users.map(user => new TgUserDto(user.TgUser as TgUser));
};

const getOneUser = async (tgUserId: string): Promise<TgUserDto> => {
    const user = await TgUser.findByPk(tgUserId, { include: [{ model: Contractor }, { model: User }] });
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found tgUser with id ' + tgUserId);
    return new TgUserDto(user);
};

const addObjectToUser = async (tgUserId: string, objectId: string): Promise<any> => {
    try {
        if (!tgUserId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'tgUserId is required');
        }

        if (!objectId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'objectId is required');
        }

        logger.log({
            level: 'info',
            message: `Adding object ${objectId} to user ${tgUserId}`,
        });

        const user = await TgUser.findByPk(tgUserId);
        if (!user) {
            logger.log({
                level: 'error',
                message: `User with id ${tgUserId} not found`,
            });
            throw new ApiError(httpStatus.NOT_FOUND, 'TgUser not found');
        }

        const objectDir = await models.ObjectDir.findByPk(objectId);
        if (!objectDir) {
            logger.log({
                level: 'error',
                message: `Object with id ${objectId} not found`,
            });
            throw new ApiError(httpStatus.NOT_FOUND, 'Object not found');
        }

        try {
            const relation = await (models.TgUserObject as any).create({
                tgUserId,
                objectId,
            });

            logger.log({
                level: 'info',
                message: `Successfully added object ${objectId} to user ${tgUserId}`,
                data: {
                    relationId: relation.id,
                    tgUserId: relation.tgUserId,
                    objectId: relation.objectId,
                },
            });

            return relation;
        } catch (createError: unknown) {
            if (
                createError &&
                typeof createError === 'object' &&
                'name' in createError &&
                createError.name === 'SequelizeUniqueConstraintError'
            ) {
                const deletedRelation = await (models.TgUserObject as any).findOne({
                    where: { tgUserId, objectId },
                    paranoid: false,
                });

                if (deletedRelation && deletedRelation.deletedAt) {
                    logger.log({
                        level: 'info',
                        message: `Found deleted relation between user ${tgUserId} and object ${objectId}, restoring it`,
                    });

                    await deletedRelation.restore();

                    const restoredRelation = await (models.TgUserObject as any).findOne({
                        where: { tgUserId, objectId },
                    });

                    logger.log({
                        level: 'info',
                        message: `Successfully restored relation between user ${tgUserId} and object ${objectId}`,
                    });

                    return restoredRelation;
                } else {
                    logger.log({
                        level: 'warn',
                        message: `Active relation between user ${tgUserId} and object ${objectId} already exists`,
                    });
                    throw new ApiError(httpStatus.CONFLICT, 'Relation already exists');
                }
            }

            logger.log({
                level: 'error',
                message: `Error creating relation between user ${tgUserId} and object ${objectId}`,
                error: createError,
            });

            throw createError;
        }
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        logger.log({
            level: 'error',
            message: `Unexpected error adding object ${objectId} to user ${tgUserId}`,
            error,
        });

        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to add object to user');
    }
};

const removeObjectFromUser = async (tgUserId: string, objectId: string): Promise<boolean> => {
    try {
        if (!tgUserId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'tgUserId is required');
        }

        if (!objectId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'objectId is required');
        }

        logger.log({
            level: 'info',
            message: `Removing object ${objectId} from user ${tgUserId}`,
        });

        const user = await TgUser.findByPk(tgUserId);
        if (!user) {
            logger.log({
                level: 'error',
                message: `User with id ${tgUserId} not found`,
            });
            throw new ApiError(httpStatus.NOT_FOUND, 'TgUser not found');
        }

        const objectDir = await models.ObjectDir.findByPk(objectId);
        if (!objectDir) {
            logger.log({
                level: 'error',
                message: `Object with id ${objectId} not found`,
            });
            throw new ApiError(httpStatus.NOT_FOUND, 'Object not found');
        }

        const deleted = await (models.TgUserObject as any).destroy({
            where: { tgUserId, objectId },
        });

        if (!deleted) {
            logger.log({
                level: 'warn',
                message: `Relation between user ${tgUserId} and object ${objectId} not found`,
            });
            throw new ApiError(httpStatus.NOT_FOUND, 'Relation not found');
        }

        logger.log({
            level: 'info',
            message: `Successfully removed object ${objectId} from user ${tgUserId}`,
        });

        return true;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        logger.log({
            level: 'error',
            message: `Unexpected error removing object ${objectId} from user ${tgUserId}`,
            error,
        });

        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to remove object from user');
    }
};

const getUserObjects = async (tgUserId: string): Promise<any[]> => {
    try {
        if (!tgUserId) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'tgUserId is required');
        }

        logger.log({
            level: 'info',
            message: `Getting objects for user ${tgUserId}`,
        });

        const user = await TgUser.findByPk(tgUserId);
        if (!user) {
            logger.log({
                level: 'error',
                message: `User with id ${tgUserId} not found`,
            });
            throw new ApiError(httpStatus.NOT_FOUND, 'TgUser not found');
        }

        logger.log({
            level: 'info',
            message: `Querying for user objects`,
            data: { tgUserId },
        });

        const relationCount = await (models.TgUserObject as any).count({
            where: { tgUserId },
        });

        logger.log({
            level: 'info',
            message: `Found ${relationCount} relation records in database for user ${tgUserId}`,
        });

        const userObjects = await (models.TgUserObject as any).findAll({
            where: { tgUserId },
            include: [
                {
                    model: models.ObjectDir,
                    as: 'Object',
                    required: true,
                },
            ],
        });

        logger.log({
            level: 'info',
            message: `Found ${userObjects.length} relations with objects for user ${tgUserId}`,
            data: userObjects.map((obj: any) => ({
                id: obj.id,
                tgUserId: obj.tgUserId,
                objectId: obj.objectId,
                objectName: obj.Object?.name || null,
            })),
        });

        const objects = userObjects
            .map((relation: any) => relation.Object)
            .filter((object: any) => object !== null && object !== undefined);

        logger.log({
            level: 'info',
            message: `Final objects list for user ${tgUserId}: ${objects.length} items`,
            data: objects.map((obj: any) => (obj ? { id: obj.id, name: obj.name } : null)).filter(Boolean),
        });

        return objects;
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }

        logger.log({
            level: 'error',
            message: `Unexpected error retrieving objects for user ${tgUserId}`,
            error,
        });

        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to retrieve user objects');
    }
};

export default {
    create,
    syncManagerToTgUser,
    findUserByTgId,
    getAll,
    getAllManagers,
    getOneUser,
    addObjectToUser,
    removeObjectFromUser,
    getUserObjects,
};
