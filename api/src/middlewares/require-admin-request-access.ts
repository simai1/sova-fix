import { Request, RequestHandler } from 'express';
import httpStatus from 'http-status';
import { validate as isUuid } from 'uuid';
import {
    assertObjectAccess,
    loadAccessibleRequest,
    loadAccessibleRequests,
    loadRequestScope,
    RequestScope,
} from '../services/request-access.service';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';

const unauthorized = (): ApiError => new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован');

const invalidId = (): ApiError => new ApiError(httpStatus.BAD_REQUEST, 'Некорректный идентификатор');

const invalidBulk = (fieldName: string): ApiError =>
    new ApiError(httpStatus.BAD_REQUEST, `Поле ${fieldName} должно быть непустым массивом UUID`);

const normalizeUuid = (value: unknown): string => {
    if (typeof value !== 'string') throw invalidId();
    const normalized = value.trim().toLowerCase();
    if (!isUuid(normalized)) throw invalidId();
    return normalized;
};

const getScope = (req: Request): RequestScope => {
    if (!req.requestScope) throw unauthorized();
    return req.requestScope;
};

export const attachRequestScope: RequestHandler = catchAsync(async (req, _res, next) => {
    if (!req.actor) throw unauthorized();
    if (!req.requestScope) req.requestScope = await loadRequestScope(req.actor);
    return next();
});

export const requireRequestParamAccess = (paramName = 'requestId'): RequestHandler =>
    catchAsync(async (req, _res, next) => {
        const requestId = normalizeUuid(req.params[paramName]);
        req.repairRequest = await loadAccessibleRequest(requestId, getScope(req));
        return next();
    });

export const requireRequestBodyAccess = (fieldName = 'requestId'): RequestHandler =>
    catchAsync(async (req, _res, next) => {
        const requestId = normalizeUuid(req.body?.[fieldName]);
        req.repairRequest = await loadAccessibleRequest(requestId, getScope(req));
        return next();
    });

export const requireObjectBodyAccess = (fieldName = 'objectId'): RequestHandler =>
    catchAsync(async (req, _res, next) => {
        const objectId = normalizeUuid(req.body?.[fieldName]);
        assertObjectAccess(objectId, getScope(req));
        return next();
    });

export const requireObjectParamAccess = (paramName = 'objectId'): RequestHandler =>
    catchAsync(async (req, _res, next) => {
        const objectId = normalizeUuid(req.params[paramName]);
        assertObjectAccess(objectId, getScope(req));
        return next();
    });

export const requireBulkRequestAccess = (fieldName = 'requestIds'): RequestHandler =>
    catchAsync(async (req, _res, next) => {
        const values = req.body?.[fieldName];
        if (!Array.isArray(values) || values.length === 0) throw invalidBulk(fieldName);
        const requestIds = values.map(normalizeUuid);
        req.scopedRequests = await loadAccessibleRequests(requestIds, getScope(req));
        return next();
    });
