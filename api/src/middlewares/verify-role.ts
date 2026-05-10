import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';

const verifyRole = (role: number) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        // refresh-cookie может отсутствовать (новая вкладка / cleared cookies / cross-site)
        // или быть невалидной. Любой такой случай — это «не авторизован», 401, а не 500
        // от Sequelize (`WHERE refresh_token = undefined`) и не 400 «Not found token».
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'User unauthorized'));
        }
        let user;
        try {
            user = await userService.getUserByRefreshToken(refreshToken);
        } catch {
            // getUserByRefreshToken бросает 400 «Not found token» если токен в БД не найден —
            // это всё та же ситуация «пользователь не авторизован», нормализуем в 401.
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
