import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const verifyRole = (role: number) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        let user;
        try {
            user = await userService.getUserByRefreshToken(refreshToken);
        } catch {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        if (!user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        if (role !== user.role) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden action'));
        }
        return next();
    });

export default verifyRole;
