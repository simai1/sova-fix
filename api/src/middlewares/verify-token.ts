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
        if (!userData) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }

        req.user = userData;
        next();
    } catch (e) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
    }
};

export default {
    auth: auth,
};
