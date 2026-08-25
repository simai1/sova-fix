import crypto from 'crypto';
import { Transaction } from 'sequelize';
import User from '../models/user';
import TgUser from '../models/tgUser';
import Contractor from '../models/contractor';
import { sequelize } from '../models';
import roles, { roleNamesRu } from '../config/roles';
import UserDto from '../dtos/user.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import generator from 'generate-password';
import sendMail from './email.service';

import userService from './user.service';
import jwtUtils from '../utils/jwt';
import { encrypt, isMatch, needsRehash } from '../utils/encryption';
import { emitTo } from '../utils/ws';
import wsEvents from '../config/wsEvents';
import logger from '../utils/logger';
import notificationService from './notification.service';
import { getAdministrativeAudienceUserIds } from './request-access.service';
import { ACCESS_DISABLED_MESSAGE } from '../config/authMessages';

const PENDING_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export const hashPendingToken = (plain: string): string => crypto.createHash('sha256').update(plain).digest('hex');

type data = {
    accessToken: string;
    refreshToken: string;
    rememberMe: boolean;
    user: UserDto;
};
const register = async (login: string, role: number): Promise<UserDto> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');

    const password = generator.generate({
        length: 10,
        numbers: true,
    });

    const encryptedPassword = await encrypt(password);
    // Транзакция: исполнитель без строки Contractor виден в справочнике
    // пользователей, но не в справочнике исполнителей — назначить на него
    // заявку нельзя, и заметно это далеко не сразу.
    const user = await sequelize.transaction(async transaction => {
        const created = await User.create(
            {
                login,
                name: '',
                password: encryptedPassword,
                role,
            },
            { transaction }
        );
        if (role === roles.CONTRACTOR) {
            await Contractor.create({ userId: created.id }, { transaction });
        }
        return created;
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`, roleNamesRu[role]);
    return new UserDto(user);
};

const login = async (email: string, password: string, rememberMe = false): Promise<data> => {
    const failMessage = 'Неверный логин или пароль';
    const user = await userService.getUserByEmail(email);
    if (!user) {
        logger.info(`[auth.login] fail: no_user email=${email}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, failMessage);
    }
    const passwordOk = await isMatch(password, user.password);
    if (!passwordOk) {
        logger.info(`[auth.login] fail: bad_password userId=${user.id}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, failMessage);
    }
    if (!user.isActivated && user.pendingVerifyToken) {
        logger.info(`[auth.login] fail: pending_approval userId=${user.id}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, failMessage);
    }
    if (user.isDisabled) {
        logger.info(`[auth.login] fail: access_disabled userId=${user.id}`);
        throw new ApiError(httpStatus.UNAUTHORIZED, ACCESS_DISABLED_MESSAGE);
    }

    if (needsRehash(user.password)) {
        try {
            const upgraded = await encrypt(password);
            await user.update({ password: upgraded });
        } catch (e) {
            logger.warn(`[auth.login] rehash failed userId=${user.id}: ${(e as Error).message}`);
        }
    }

    const userDto = new UserDto(user);
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto }, rememberMe);
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        rememberMe,
        user: userDto,
    };
};

const activate = async (password: string, name: string, userId: string): Promise<data> => {
    const user = await userService.getUserById(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User doesnt exists');
    if (user.isActivated) throw new ApiError(httpStatus.BAD_REQUEST, 'User already activated');
    if (user.pendingVerifyToken) throw new ApiError(httpStatus.BAD_REQUEST, 'User already activated');
    if (user.isDisabled) throw new ApiError(httpStatus.FORBIDDEN, ACCESS_DISABLED_MESSAGE);

    const encryptedPassword = await encrypt(password);
    await user.update({ isActivated: true, password: encryptedPassword, name });
    const userDto = new UserDto(user);
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto }, false);
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        rememberMe: false,
        user: userDto,
    };
};

const logout = async (refreshToken: string): Promise<void> => {
    await jwtUtils.removeToken(refreshToken);
};

const refresh = async (refreshToken: string): Promise<data> => {
    return await jwtUtils.refresh(refreshToken);
};

type RegisterPublicResult = {
    user: UserDto;
    pendingVerifyToken: string;
    pendingVerifyTokenExpiresAt: Date;
};

const registerPublic = async (
    login: string,
    password: string,
    name: string,
    role: number
): Promise<RegisterPublicResult> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'Пользователь с такой почтой уже зарегистрирован');

    const encryptedPassword = await encrypt(password);
    const user = await User.create({
        login,
        name,
        password: encryptedPassword,
        role,
        isActivated: false,
    });

    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashPendingToken(plainToken);
    const expiresAt = new Date(Date.now() + PENDING_TOKEN_TTL_MS);
    await user.update({
        pendingVerifyToken: tokenHash,
        pendingVerifyTokenExpiresAt: expiresAt,
    });

    const dto = new UserDto(user);
    const audienceUserIds = await getAdministrativeAudienceUserIds();
    emitTo({ kind: 'users', userIds: audienceUserIds }, wsEvents.USER_REGISTRATION_REQUEST, { userId: dto.id });

    await notificationService.notifyRegistrationRequest(role);

    return { user: dto, pendingVerifyToken: plainToken, pendingVerifyTokenExpiresAt: expiresAt };
};

// Роли, которым бот может самостоятельно выдать доступ в CRM.
// Значения ролей в tg_users и users совпадают только для 3 и 4, поэтому список явный.
const CRM_SELF_SERVICE_ROLES: number[] = [roles.CUSTOMER, roles.CONTRACTOR];

/**
 * Связывает созданный web-аккаунт исполнителя с его записью Contractor.
 * Без этого ЛК исполнителя (lk.service.loadUserContext ищет Contractor по userId)
 * покажет пустой список заявок, не выдав никакой ошибки.
 */
const linkContractor = async (userId: string, tgUserId: string, transaction: Transaction): Promise<Contractor> => {
    const contractor = await Contractor.findOne({
        where: { tgUserId },
        transaction,
        lock: transaction.LOCK.UPDATE,
    });

    if (!contractor) {
        return Contractor.create({ userId, tgUserId }, { transaction });
    }
    if (contractor.userId && contractor.userId !== userId) {
        throw new ApiError(httpStatus.CONFLICT, 'Этот Telegram уже привязан к другому аккаунту CRM');
    }
    await contractor.update({ userId }, { transaction });
    return contractor;
};

/**
 * Выдаёт доступ в CRM пользователю бота. Роль web-аккаунта определяется на сервере
 * по tg_users.role — клиент её не передаёт (роут закрыт requireBotActor + master-api-key).
 */
const registerCrmAccessFromBot = async (login: string, tgId: string): Promise<UserDto> => {
    const tgUser = await TgUser.findOne({ where: { tgId } });
    if (!tgUser) throw new ApiError(httpStatus.NOT_FOUND, 'Telegram-пользователь не найден');

    if (!CRM_SELF_SERVICE_ROLES.includes(tgUser.role))
        throw new ApiError(httpStatus.FORBIDDEN, 'Доступ к CRM доступен только заказчикам и исполнителям');

    const existingAccess = await User.findOne({ where: { tgManagerId: tgUser.id } });
    if (existingAccess) throw new ApiError(httpStatus.BAD_REQUEST, 'Доступ к CRM уже выдан');

    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');

    const password = generator.generate({
        length: 10,
        numbers: true,
    });

    const encryptedPassword = await encrypt(password);
    const user = await sequelize.transaction(async transaction => {
        const created = await User.create(
            {
                login,
                name: '',
                password: encryptedPassword,
                tgManagerId: tgUser.id,
                role: tgUser.role,
            },
            { transaction }
        );
        if (tgUser.role === roles.CONTRACTOR) {
            await linkContractor(created.id, tgUser.id, transaction);
        }
        return created;
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`, roleNamesRu[tgUser.role]);
    return new UserDto(user);
};

export default {
    register,
    login,
    activate,
    logout,
    refresh,
    registerCrmAccessFromBot,
    registerPublic,
};
