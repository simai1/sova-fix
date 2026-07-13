import { NextFunction, Request, Response } from 'express';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import jwtUtils from '../utils/jwt';

const auth = (req: Request, res: Response, next: NextFunction) => {
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
