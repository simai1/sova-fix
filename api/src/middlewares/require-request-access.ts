import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';
import RepairRequest from '../models/repairRequest';
import lkService from '../services/lk.service';
import roles, { mapRoles } from '../config/roles';

type Mode = 'read' | 'write';
type LkRole = 'CONTRACTOR' | 'CUSTOMER' | 'ADMIN';

const resolveLkRole = (req: Request): LkRole => {
    const u = (req as any).user || {};
    const roleNumber: number = typeof u.role === 'number' ? u.role : (roles as Record<string, number>)[u.role] || 0;
    if (roleNumber === roles.ADMIN) return 'ADMIN';
    if (roleNumber === roles.CONTRACTOR) return 'CONTRACTOR';
    return 'CUSTOMER';
};

export const requireRequestAccess = (paramName: string, mode: Mode) =>
    catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
        const u = (req as any).user || {};
        const userId: string | undefined = u.id;
        if (!userId) {
            return next(new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован'));
        }
        const requestId = req.params[paramName];
        if (!requestId || typeof requestId !== 'string') {
            return next(new ApiError(httpStatus.BAD_REQUEST, 'Некорректный идентификатор'));
        }

        const repairRequest = await RepairRequest.findByPk(requestId);
        if (!repairRequest) {
            return next(new ApiError(httpStatus.NOT_FOUND, 'Заявка не найдена'));
        }

        const role = resolveLkRole(req);
        const ctx = await lkService.loadUserContext(userId);
        const accessCtx = { contractor: ctx.contractor, objectIds: ctx.objectIds, userId };

        if (mode === 'read') {
            if (!lkService.canRead(repairRequest, role, accessCtx)) {
                return next(new ApiError(httpStatus.FORBIDDEN, 'У вас нет доступа к этой заявке'));
            }
        } else {
            if (!lkService.canWrite(repairRequest, role, accessCtx)) {
                const msg =
                    role === 'CUSTOMER'
                        ? 'Изменять заявку может только её автор'
                        : 'Изменять заявку может только назначенный исполнитель';
                return next(new ApiError(httpStatus.FORBIDDEN, msg));
            }
        }

        (req as any).repairRequest = repairRequest;
        (req as any).lkRole = role;
        void mapRoles;
        return next();
    });

export default requireRequestAccess;
