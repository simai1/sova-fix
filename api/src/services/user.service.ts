import { Op, WhereOptions } from 'sequelize';
import User from '../models/user';
import tokenService from './token.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles from '../config/roles';
import UserDto from '../dtos/user.dto';
import TgUser from '../models/tgUser';
import { emitTo, sendMsg, WsMsgData } from '../utils/ws';
import Contractor from '../models/contractor';
import wsEvents from '../config/wsEvents';
import notificationService from './notification.service';
import UserObject from '../models/userObject';
import ObjectDir from '../models/object';
import { sequelize } from '../models';

type userDir = {
    id: string;
    isConfirmed: boolean;
    login: string | null | undefined;
    tgId: string | null | undefined;
    linkId: string | null | undefined;
    tgUserId: string | null | undefined;
    name: string;
    role: number;
};

const getUserById = async (userId: string): Promise<User | null> => {
    return User.findByPk(userId);
};

const getUserByEmail = async (login: string): Promise<User | null> => {
    return User.findOne({ where: { login } });
};

const getUserByRefreshToken = async (refreshToken: string): Promise<User | null> => {
    const token = await tokenService.getTokenByRefreshToken(refreshToken);
    if (!token) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found token');
    return await getUserById(token.userId);
};

const setRole = async (role: number, userId: string, actorUserId: string): Promise<void> => {
    if (!Object.values(roles).includes(role)) throw new ApiError(httpStatus.BAD_REQUEST, 'Некорректная роль');
    const [actor, target] = await Promise.all([getUserById(actorUserId), getUserById(userId)]);
    if (!actor || !target) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    if (actor.id === target.id) throw new ApiError(httpStatus.BAD_REQUEST, 'Нельзя изменить собственную роль');
    if (role === roles.MANAGER && actor.role !== roles.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Назначить роль Менеджера может только Администратор');
    }
    await target.update({ role });
};

const getAllUsers = async (): Promise<UserDto[]> => {
    const users = await User.findAll({ order: [['name', 'ASC']] });
    return users.map(u => new UserDto(u));
};

const getPendingRegistrations = async (): Promise<UserDto[]> => {
    const where: WhereOptions = {
        isActivated: false,
        pendingVerifyToken: { [Op.ne]: null },
    };
    const users = await User.findAll({
        where,
        order: [['createdAt', 'DESC']],
    });
    return users.map(u => new UserDto(u));
};

const approveUser = async (userId: string): Promise<UserDto> => {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    const isWebSelfRegPending = !user.isActivated && !!user.pendingVerifyToken;
    if (!isWebSelfRegPending) throw new ApiError(httpStatus.BAD_REQUEST, 'Пользователь уже подтверждён');

    await user.update({
        isActivated: true,
        pendingVerifyToken: null,
        pendingVerifyTokenExpiresAt: null,
    });
    if (user.role === roles.CONTRACTOR) {
        await Contractor.create({ userId: user.id });
    }
    emitTo({ kind: 'user', userId: user.id }, wsEvents.USER_CONFIRM, { userId: user.id });

    await notificationService.notifyRegistrationApproved(user.id);

    return new UserDto(user);
};

const getUsersDir = async (): Promise<userDir[]> => {
    const users = await User.findAll({ include: [{ model: TgUser }] });
    const tgUsers = await TgUser.findAll();
    const userDirs: userDir[] = [];

    users.forEach(user => {
        userDirs.push({
            id: user.id,
            isConfirmed: user.isActivated,
            login: user.login,
            tgId: user.TgUser?.tgId,
            linkId: user.TgUser?.linkId,
            tgUserId: user.tgManagerId,
            name: user.TgUser?.name || user.name || user.login,
            role: user.role,
        });
    });

    for (const user of tgUsers) {
        if (!userDirs.some(ud => ud.tgUserId === user.id))
            userDirs.push({
                id: user.id,
                isConfirmed: user.isConfirmed,
                login: null,
                tgUserId: undefined,
                tgId: user.tgId,
                linkId: user.linkId,
                name: user.name,
                role: user.role,
            });
    }

    return userDirs;
};

const deleteUser = async (userId: string): Promise<void> => {
    await User.destroy({ where: { id: userId }, force: true, individualHooks: true });
};

const deleteDirUser = async (userId: string): Promise<void> => {
    let user;
    user = await getUserById(userId);
    if (!user) {
        user = await TgUser.findByPk(userId, { include: [{ model: Contractor }] });
        if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found user/tgUser with id ' + userId);
        if (user.role === 4) await Contractor.destroy({ where: { id: user.Contractor?.id }, force: true });
    }
    await user.destroy({ force: true });
};

const confirmTgUser = async (userId: string): Promise<void> => {
    const user = await TgUser.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found user with id ' + userId);
    await user.update({ isConfirmed: true });
    sendMsg({
        msg: {
            tgUser: userId,
        },
        event: 'TGUSER_CONFIRM',
    } as WsMsgData);
};

const getUserByTgId = async (tgId: string) => {
    const tgUser = await TgUser.findOne({ where: { tg_id: tgId } });
    if (!tgUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found tgUser with tgId' + tgId);
    const user = await User.findOne({ where: { tg_manager_id: tgUser.id } });
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found user with tg_manager_id' + tgUser.id);
    return new UserDto(user);
};

const assertCanManageUserObjects = async (actorUserId: string, targetUserId: string): Promise<User> => {
    const [actor, target] = await Promise.all([getUserById(actorUserId), getUserById(targetUserId)]);
    if (!actor || !target) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    const allowedTargets =
        actor.role === roles.ADMIN
            ? [roles.CUSTOMER, roles.CONTRACTOR, roles.MANAGER]
            : [roles.CUSTOMER, roles.CONTRACTOR];
    if (!allowedTargets.includes(target.role)) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Недостаточно прав для управления доступами пользователя');
    }
    return target;
};

const setUserObjects = async (userId: string, objectIds: string[], actorUserId: string): Promise<string[]> => {
    await assertCanManageUserObjects(actorUserId, userId);

    const unique = Array.from(new Set(objectIds));
    if (unique.length) {
        const found = await ObjectDir.count({ where: { id: { [Op.in]: unique } } });
        if (found !== unique.length) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Один или несколько указанных объектов не найдены');
        }
    }
    await sequelize.transaction(async transaction => {
        await UserObject.destroy({ where: { userId }, force: true, transaction });
        if (unique.length) {
            await UserObject.bulkCreate(
                unique.map(objectId => ({ userId, objectId })),
                { transaction }
            );
        }
    });
    const fresh = await UserObject.findAll({ where: { userId }, attributes: ['objectId'] });
    return fresh.map(uo => uo.objectId);
};

const getUserObjects = async (userId: string, actorUserId: string): Promise<string[]> => {
    await assertCanManageUserObjects(actorUserId, userId);
    const rows = await UserObject.findAll({ where: { userId }, attributes: ['objectId'] });
    return rows.map(r => r.objectId);
};

const updateUserPassword = async (userId: string, newHashedPassword: string) => {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    }

    user.password = newHashedPassword;
    await user.save();

    return new UserDto(user);
};

export default {
    getUserById,
    getUserByEmail,
    getUserByRefreshToken,
    setRole,
    getUsersDir,
    getAllUsers,
    getPendingRegistrations,
    approveUser,
    deleteUser,
    deleteDirUser,
    confirmTgUser,
    getUserByTgId,
    updateUserPassword,
    setUserObjects,
    getUserObjects,
};
