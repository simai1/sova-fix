import { NextFunction, Request, Response } from 'express';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import jwtUtils from '../utils/jwt';
import User from '../models/user';
import { ACCESS_DISABLED_MESSAGE } from '../config/authMessages';

/**
 * Access-токен живёт 30 минут (см. utils/jwt.ts), поэтому одной подписи мало:
 * без обращения к БД отключённый пользователь продолжал бы работать в CRM до
 * истечения токена. findByPk по первичному ключу — дешёвый индексный запрос.
 */
const auth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authorizationHeader = req.headers.authorization;
        if (!authorizationHeader) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }

        const accessToken = authorizationHeader.split(' ')[1];
        if (!accessToken) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }

        const userData = jwtUtils.verifyAccessToken(accessToken);
        if (typeof userData !== 'object' || userData === null || typeof userData.id !== 'string') {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }

        const user = await User.findByPk(userData.id, { attributes: ['id', 'isDisabled'] });
        if (!user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        if (user.isDisabled) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, ACCESS_DISABLED_MESSAGE));
        }

        req.user = {
            id: userData.id,
            ...(typeof userData.role === 'number' || typeof userData.role === 'string' ? { role: userData.role } : {}),
            ...(typeof userData.login === 'string' ? { login: userData.login } : {}),
        };
        next();
    } catch {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
    }
};

export default {
    auth: auth,
};
