import crypto from 'crypto';
import User from '../models/user';
import UserDto from '../dtos/user.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import generator from 'generate-password';
import sendMail from './email.service';

import userService from './user.service';
import jwtUtils from '../utils/jwt';
import { encrypt, isMatch, needsRehash } from '../utils/encryption';
import tgUserService from './tgUser.service';
import { emitTo } from '../utils/ws';
import roles from '../config/roles';
import wsEvents from '../config/wsEvents';
import logger from '../utils/logger';
import notificationService from './notification.service';

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
    const user = await User.create({
        login,
        name: '',
        password: encryptedPassword,
        role,
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`);
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
    emitTo({ kind: 'role', roles: [roles.ADMIN] }, wsEvents.USER_REGISTRATION_REQUEST, { userId: dto.id });

    await notificationService.notifyRegistrationRequest(role);

    return { user: dto, pendingVerifyToken: plainToken, pendingVerifyTokenExpiresAt: expiresAt };
};

const registerCustomerCrm = async (login: string, tgId: string): Promise<UserDto> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');
    const tgUser = await tgUserService.findUserByTgId(tgId);

    const password = generator.generate({
        length: 10,
        numbers: true,
    });

    const encryptedPassword = await encrypt(password);
    const user = await User.create({
        login,
        name: '',
        password: encryptedPassword,
        tgManagerId: tgUser?.id,
        role: 3,
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`);
    return new UserDto(user);
};

export default {
    register,
    login,
    activate,
    logout,
    refresh,
    registerCustomerCrm,
    registerPublic,
};
