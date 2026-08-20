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
import { Transaction } from 'sequelize';
import RepairRequest from '../models/repairRequest';
import RequestComment from '../models/requestComment';
import TokenModel from '../models/token-model';
import PushSubscription from '../models/pushSubscription';
import UserTgBindingToken from '../models/userTgBindingToken';
import PasswordResetToken from '../models/passwordResetTokens';
import TgUserObject from '../models/tgUserObject';
import DirectoryCategory from '../models/directoryCategory';
import DirectoryCategoryCustomer from '../models/directoryCategoryCustomer';
import { disconnectUser } from '../utils/ws';
import logger from '../utils/logger';

type userDir = {
    id: string;
    isConfirmed: boolean;
    login: string | null | undefined;
    tgId: string | null | undefined;
    linkId: string | null | undefined;
    tgUserId: string | null | undefined;
    name: string;
    role: number;
    isDisabled: boolean;
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
    if (!actor) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    if (actor.role !== roles.ADMIN) {
        throw new ApiError(httpStatus.FORBIDDEN, 'Изменять роли пользователей может только Администратор');
    }
    if (!target) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    if (actor.id === target.id) throw new ApiError(httpStatus.BAD_REQUEST, 'Нельзя изменить собственную роль');
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
            isDisabled: user.isDisabled === true,
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
                isDisabled: user.isDisabled === true,
            });
    }

    return userDirs;
};

/**
 * Отвязывает пользователя от записей Contractor и убирает осиротевшие из выборок.
 *
 * Физически строку не удаляем: на неё ссылаются repair-requests.contractor_id,
 * equipment, tech-services. Но и живой строки без userId/tgUserId быть не должно —
 * getContractorNameOrThrow (utils/contractorName.ts) на такой бросает исключение,
 * и GET /contractors начинает отдавать 500. Модель paranoid, поэтому мягкого
 * удаления достаточно: строка остаётся в БД, но уходит из выборок.
 */
const detachContractors = async (
    field: 'userId' | 'tgUserId',
    ownerId: string,
    transaction: Transaction
): Promise<void> => {
    const contractors = await Contractor.findAll({
        where: { [field]: ownerId },
        paranoid: false,
        transaction,
    });

    for (const contractor of contractors) {
        await contractor.update({ [field]: null }, { transaction });
        const stillLinked = field === 'userId' ? contractor.tgUserId : contractor.userId;
        if (!stillLinked) await contractor.destroy({ transaction });
    }
};

/**
 * Считает записи, ради которых пользователя и держат в системе.
 *
 * paranoid: false обязателен — RepairRequest и RequestComment мягко удаляемые,
 * их «удалённые» строки физически остаются в таблице и продолжают держать FK.
 */
const countWebUserLinks = async (userId: string): Promise<number> => {
    const [requests, comments] = await Promise.all([
        RepairRequest.count({ where: { createdByUserId: userId }, paranoid: false }),
        RequestComment.count({ where: { authorUserId: userId }, paranoid: false }),
    ]);
    return requests + comments;
};

const countTgUserLinks = async (tgUserId: string): Promise<number> =>
    RepairRequest.count({
        where: { [Op.or]: [{ createdBy: tgUserId }, { managerId: tgUserId }] },
        paranoid: false,
    });

const tooManyLinks = (count: number): ApiError =>
    new ApiError(
        httpStatus.CONFLICT,
        `У пользователя есть связанные заявки и комментарии (${count}). ` + 'Удалить его нельзя — отключите доступ.'
    );

const deleteWebUser = async (user: User): Promise<void> => {
    const links = await countWebUserLinks(user.id);
    if (links > 0) throw tooManyLinks(links);

    await sequelize.transaction(async transaction => {
        const where = { userId: user.id };
        await UserObject.destroy({ where, force: true, transaction });
        await UserTgBindingToken.destroy({ where, force: true, transaction });
        await PasswordResetToken.destroy({ where, force: true, transaction });
        await PushSubscription.destroy({ where, force: true, transaction });
        await TokenModel.destroy({ where, force: true, transaction });
        await detachContractors('userId', user.id, transaction);
        await user.destroy({ force: true, transaction });
    });
};

const deleteTgUser = async (tgUser: TgUser): Promise<void> => {
    const links = await countTgUserLinks(tgUser.id);
    if (links > 0) throw tooManyLinks(links);

    await sequelize.transaction(async transaction => {
        await TgUserObject.destroy({ where: { tgUserId: tgUser.id }, force: true, transaction });
        await DirectoryCategoryCustomer.destroy({ where: { tgUserId: tgUser.id }, force: true, transaction });
        await DirectoryCategory.update({ managerId: null }, { where: { managerId: tgUser.id }, transaction });
        await User.update({ tgManagerId: null }, { where: { tgManagerId: tgUser.id }, transaction });
        await detachContractors('tgUserId', tgUser.id, transaction);
        await tgUser.destroy({ force: true, transaction });
    });
};

const deleteDirUser = async (userId: string): Promise<void> => {
    const user = await getUserById(userId);
    if (user) return deleteWebUser(user);

    const tgUser = await TgUser.findByPk(userId);
    if (!tgUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found user/tgUser with id ' + userId);
    return deleteTgUser(tgUser);
};

/**
 * Обрывает все живые сессии пользователя: refresh-токен, push-подписки
 * и незавершённые привязки Telegram. Access-токен живёт до 30 минут и
 * гасится проверкой isDisabled в middlewares/verify-token.
 */
const revokeSessions = async (userId: string, transaction: Transaction): Promise<void> => {
    const where = { userId };
    await TokenModel.destroy({ where, force: true, transaction });
    await PushSubscription.destroy({ where, force: true, transaction });
    await UserTgBindingToken.destroy({ where, force: true, transaction });
};

const disabledPatch = (disabled: boolean, actorUserId: string) => ({
    isDisabled: disabled,
    disabledAt: disabled ? new Date() : null,
    disabledBy: disabled ? actorUserId : null,
});

export type UserDisabledResult = {
    id: string;
    isDisabled: boolean;
};

/**
 * Включает/отключает доступ. Справочник пользователей смешанный (getUsersDir отдаёт
 * и users, и tgUsers), поэтому id может указывать на любую из двух таблиц. Связанные
 * web- и Telegram-аккаунты переключаются вместе: иначе отключённый в CRM продолжал бы
 * пользоваться ботом.
 */
const setUserDisabled = async (
    targetId: string,
    disabled: boolean,
    actorUserId: string
): Promise<UserDisabledResult> => {
    if (targetId === actorUserId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Нельзя отключить собственный доступ');
    }

    const patch = disabledPatch(disabled, actorUserId);
    const user = await getUserById(targetId);
    const tgUser = user ? null : await TgUser.findByPk(targetId);
    if (!user && !tgUser) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');

    const webUser = user ?? (await User.findOne({ where: { tgManagerId: (tgUser as TgUser).id } }));
    const linkedTgUserId = tgUser ? (tgUser as TgUser).id : user?.tgManagerId;

    // Отключение TG-аккаунта тянет за собой связанный web-аккаунт, поэтому
    // проверки targetId !== actorUserId мало: админ может оказаться владельцем
    // именно этого TG-аккаунта и запереть сам себя.
    if (webUser?.id === actorUserId) {
        throw new ApiError(httpStatus.BAD_REQUEST, 'Нельзя отключить собственный доступ');
    }

    await sequelize.transaction(async transaction => {
        if (user) await user.update(patch, { transaction });
        if (tgUser) await tgUser.update(patch, { transaction });
        if (linkedTgUserId && !tgUser) {
            await TgUser.update(patch, { where: { id: linkedTgUserId }, transaction });
        }
        if (webUser && !user) {
            await webUser.update(patch, { transaction });
        }
        if (disabled && webUser) await revokeSessions(webUser.id, transaction);
    });

    if (disabled && webUser) {
        emitTo({ kind: 'user', userId: webUser.id }, wsEvents.USER_ACCESS_DISABLED, { userId: webUser.id });
        disconnectUser(webUser.id);
    }

    logger.log({
        level: 'warn',
        message: `[user.setUserDisabled] ${disabled ? 'disabled' : 'enabled'} target=${targetId} actor=${actorUserId}`,
    });

    return { id: targetId, isDisabled: disabled };
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
    if (target.isDisabled) {
        throw new ApiError(httpStatus.CONFLICT, 'У пользователя отключён доступ — сначала включите его');
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
    deleteDirUser,
    setUserDisabled,
    confirmTgUser,
    getUserByTgId,
    updateUserPassword,
    setUserObjects,
    getUserObjects,
};
