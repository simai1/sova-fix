import User from '../models/user';
import UserDto from '../dtos/user.dto';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import generator from 'generate-password';
import sendMail from './email.service';

import userService from './user.service';
import jwtUtils from '../utils/jwt';
import { encrypt, isMatch } from '../utils/encryption';
import tgUserService from './tgUser.service';
import { sendMsg, WsMsgData } from '../utils/ws';
import wsEvents from '../config/wsEvents';

type data = {
    accessToken: string;
    refreshToken: string;
    user: UserDto;
};
const register = async (login: string): Promise<UserDto> => {
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
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`);
    return new UserDto(user);
};

const login = async (email: string, password: string): Promise<data> => {
    const user = await userService.getUserByEmail(email);
    if (!user || !(await isMatch(password, user.password)))
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Неверный логин или пароль');

    if (user.pendingApproval)
        throw new ApiError(httpStatus.FORBIDDEN, 'Ваша заявка ещё не подтверждена менеджером');

    const userDto = new UserDto(user);
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto });
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: userDto,
    };
};

const activate = async (password: string, name: string, userId: string): Promise<data> => {
    const user = await userService.getUserById(userId);
    if (!user) throw new ApiError(httpStatus.BAD_REQUEST, 'User doesnt exists');
    if (user.isActivated) throw new ApiError(httpStatus.BAD_REQUEST, 'User already activated');

    const encryptedPassword = await encrypt(password);
    await user.update({ isActivated: true, password: encryptedPassword, name });
    const userDto = new UserDto(user);
    const { accessToken, refreshToken } = jwtUtils.generate({ ...userDto });
    await jwtUtils.saveToken(userDto.id, refreshToken);
    return {
        accessToken: accessToken,
        refreshToken: refreshToken,
        user: userDto,
    };
};

const logout = async (refreshToken: string): Promise<void> => {
    await jwtUtils.removeToken(refreshToken);
};

const refresh = async (refreshToken: string): Promise<data> => {
    return await jwtUtils.refresh(refreshToken);
};

const registerPublic = async (
    login: string,
    password: string,
    name: string,
    role: number
): Promise<UserDto> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser)
        throw new ApiError(httpStatus.BAD_REQUEST, 'Пользователь с такой почтой уже зарегистрирован');

    const encryptedPassword = await encrypt(password);
    const user = await User.create({
        login,
        name,
        password: encryptedPassword,
        role,
        isActivated: true,
        pendingApproval: true,
    });

    const dto = new UserDto(user);
    // PII не шлём в broadcast — ws-канал без auth, любой клиент его получит.
    // Менеджер увидит детали через GET /users/pending-registrations (с auth).
    sendMsg({
        msg: { userId: dto.id },
        event: wsEvents.USER_REGISTRATION_REQUEST,
    } as WsMsgData);

    return dto;
};

const registerCustomerCrm = async (login: string, tgId: string): Promise<UserDto> => {
    const checkUser = await userService.getUserByEmail(login);
    if (checkUser) throw new ApiError(httpStatus.BAD_REQUEST, 'User with this email already exists');
    const tgUser = await tgUserService.findUserByTgId(tgId)

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
        role: 3
    });

    sendMail(login, 'registration', password, `${process.env.WEB_URL}`);
    return new UserDto(user);
}

export default {
    register,
    login,
    activate,
    logout,
    refresh,
    registerCustomerCrm,
    registerPublic,
};
