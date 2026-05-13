import jwt from 'jsonwebtoken';
import ApiError from './ApiError';
import httpStatus from 'http-status';
import userService from '../services/user.service';
import tokenService from '../services/token.service';
import UserDto from '../dtos/user.dto';
import User from '../models/user';

type JwtPayload = {
    id: string;
    // rememberMe — переносится из login в refresh-токен, чтобы /auth/refresh
    // продлевал cookie тем же сроком (persistent vs session), что и выбрал
    // пользователь чекбоксом «Запомнить меня». Без этого refresh-цикл
    // незаметно превращал session-cookie в persistent.
    rememberMe?: boolean;
};

const generate = (payload: object, rememberMe = false) => {
    const fullPayload = { ...payload, rememberMe };
    const accessToken = jwt.sign(fullPayload, process.env.JWT_ACCESS_SECRET as string, { expiresIn: '30m' });
    const refreshToken = jwt.sign(fullPayload, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '30d' });
    return {
        accessToken,
        refreshToken,
        rememberMe,
    };
};

const saveToken = async (userId: string, refreshToken: string) => {
    const tokenData = await tokenService.getTokenByUserId(userId);
    if (tokenData) {
        return await tokenService.updateRefreshToken(userId, refreshToken);
    }

    return await tokenService.createToken(userId, refreshToken);
};

const removeToken = async (refreshToken: string) => {
    return await tokenService.destroyTokenByRefreshToken(refreshToken);
};

const verifyAccessToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET as string);
};

const verifyRefreshToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET as string);
};

const findToken = async (refreshToken: string) => {
    return await tokenService.getTokenByRefreshToken(refreshToken);
};

const decode = (token: string) => {
    return jwt.decode(token);
};

const refresh = async (refreshToken: string) => {
    if (!refreshToken) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User  unauthorized');
    }
    const userData = verifyRefreshToken(refreshToken) as JwtPayload;
    const tokenFromDb = await findToken(refreshToken);
    if (!userData || !tokenFromDb) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'User  unauthorized');
    }

    const user = await userService.getUserById(userData.id);
    if (!user) {
        throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const userDto = new UserDto(user as User);
    // Сохраняем тот же rememberMe из исходного refresh-токена — иначе после
    // первого refresh-цикла все cookie стали бы persistent независимо от
    // изначального выбора пользователя.
    const tokens = generate({ ...userDto }, Boolean(userData.rememberMe));

    await saveToken(userDto.id, tokens.refreshToken);
    return { ...tokens, user: userDto };
};

export default {
    generate,
    saveToken,
    removeToken,
    verifyAccessToken,
    verifyRefreshToken,
    findToken,
    decode,
    refresh,
};
