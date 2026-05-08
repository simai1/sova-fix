import { Op } from 'sequelize';
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

const setRole = async (role: number, userId: string): Promise<void> => {
    if (!Object.values(roles).includes(role)) throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid role');
    const user = await getUserById(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'Not found user');
    await user.update({ role });
};

const getAllUsers = async (): Promise<UserDto[]> => {
    const users = await User.findAll({ order: [['name', 'ASC']] });
    return users.map(u => new UserDto(u));
};

const getPendingRegistrations = async (): Promise<UserDto[]> => {
    const users = await User.findAll({
        where: { pendingApproval: true },
        order: [['createdAt', 'DESC']],
    });
    return users.map(u => new UserDto(u));
};

const approveUser = async (userId: string): Promise<UserDto> => {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
    if (!user.pendingApproval) throw new ApiError(httpStatus.BAD_REQUEST, 'Пользователь уже подтверждён');

    await user.update({ pendingApproval: false });
    if (user.role === roles.CONTRACTOR) {
        await Contractor.create({ name: user.name, userId: user.id });
    }
    // Адресуем строго одному юзеру — он же подписан через `bearer.<jwt>`,
    // когда после approve откроет ЛК. Pending.jsx сейчас на legacy-канале
    // не имеет access-токена (см. followups: WS-AUTH-PENDING) — для него
    // `kind:'broadcast'` пока сохраняется как fallback ниже.
    emitTo({ kind: 'user', userId: user.id }, wsEvents.USER_CONFIRM, { userId: user.id });
    // Pending.jsx (страница ожидания approve) подключается к ws ДО получения
    // access-токена и слушает USER_CONFIRM с фильтром на свой userId. Чтобы
    // не сломать этот флоу до отдельной задачи (см. followup WS-AUTH-PENDING
    // в design §E) — параллельно шлём broadcast-копию. Это безопасно: payload
    // содержит только userId, без PII.
    sendMsg({ msg: { userId: user.id }, event: wsEvents.USER_CONFIRM } as WsMsgData);

    // Зеркало: одобрённый юзер получает push о подтверждении регистрации
    // (TG-flow аналог — TGUSER_CONFIRM из бот-flow). Текст без слов про «бота».
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
    // Legacy-событие для бота (literal, не вынесен в wsEvents). Бот получит
    // через broadcast, после удаления бота это место уйдёт целиком.
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

// Полностью перезаписывает список объектов, привязанных к пользователю.
// Делается под транзакцией: сначала удаляем старые связи, потом создаём новые.
// Использует force destroy, потому что таблица paranoid и нам не нужны
// «фантомные» soft-deleted строки, которые блокировали бы unique-индекс.
const setUserObjects = async (userId: string, objectIds: string[]): Promise<string[]> => {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');

    const unique = Array.from(new Set(objectIds));
    // Проверяем, что все переданные объекты реально существуют. Если хотя бы
    // один отсутствует — отдаём 400 (а не молча сохраняем «висячие» связи,
    // которые потом сломают list-эндпоинты при включённом валидаторе FK).
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

const getUserObjects = async (userId: string): Promise<string[]> => {
    const user = await User.findByPk(userId);
    if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'Пользователь не найден');
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
