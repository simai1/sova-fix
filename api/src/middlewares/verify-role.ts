import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import { ACCESS_DISABLED_MESSAGE } from '../config/authMessages';

const verifyRole = (role: number) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (typeof userId !== 'string') {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        let user;
        try {
            user = await userService.getUserById(userId);
        } catch {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        if (!user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        if (user.isDisabled) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, ACCESS_DISABLED_MESSAGE));
        }
        if (role !== user.role) {
            return next(new ApiError(httpStatus.FORBIDDEN, 'Forbidden action'));
        }
        return next();
    });

export default verifyRole;
