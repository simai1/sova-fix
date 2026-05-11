import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import userService from '../services/user.service';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import roles, { roleNamesRu } from '../config/roles';

// Проверяет, что у пользователя из refresh-cookie есть одна из перечисленных ролей.
// Принимает массив имён ролей (например, ['CONTRACTOR', 'CUSTOMER']) — на стороне
// JWT/маршрутов исторически фигурируют именно имена, поэтому держим тот же контракт.
const verifyAnyRole = (roleNames: string[]) =>
    catchAsync(async (req: Request, res: Response, next: NextFunction) => {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован'));
        }
        const user = await userService.getUserByRefreshToken(refreshToken);
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
        return next();
    });

export default verifyAnyRole;
