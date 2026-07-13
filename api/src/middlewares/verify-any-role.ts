import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles, { roleNamesRu } from '../config/roles';

const verifyAnyRole = (roleNames: string[]) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const userId = req.user?.id;
        if (typeof userId !== 'string') {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован'));
        }
        let user;
        try {
            user = await userService.getUserById(userId);
        } catch {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован'));
        }
        if (!user) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован'));
        }

        const allowedNumbers = roleNames
            .map(name => (roles as Record<string, number>)[name])
            .filter((n): n is number => typeof n === 'number');

        if (!allowedNumbers.includes(user.role)) {
            const userRoleRu = roleNamesRu[user.role] ?? 'вашей роли';
            return next(new ApiError(httpStatus.FORBIDDEN, `Операция недоступна для роли «${userRoleRu}».`));
        }
        req.user.role = user.role;
        return next();
    });

export default verifyAnyRole;
