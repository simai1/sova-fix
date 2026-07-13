import crypto from 'crypto';
import { NextFunction, Request, RequestHandler } from 'express';
import httpStatus from 'http-status';
import User from '../models/user';
import ApiError from '../utils/ApiError';
import catchAsync from '../utils/catchAsync';

type AccessPayload = {
    id?: unknown;
};

type JwtUtils = typeof import('../utils/jwt').default;

type DeferredJwtModule = {
    default: JwtUtils | { default: JwtUtils };
};

const loadJwtUtils = async (): Promise<JwtUtils> => {
    const module = (await import('../utils/jwt.js')) as unknown as DeferredJwtModule;
    return 'default' in module.default ? module.default.default : module.default;
};

const unauthorized = (next: NextFunction) => next(new ApiError(httpStatus.UNAUTHORIZED, 'Пользователь не авторизован'));

const forbidden = (next: NextFunction) => next(new ApiError(httpStatus.FORBIDDEN, 'Доступ запрещён'));

const getBearerToken = (authorization: string | undefined): string | null => {
    if (!authorization) return null;
    const parts = authorization.trim().split(/\s+/);
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) return null;
    return parts[1];
};

const hasValidMasterKey = (req: Request): boolean => {
    const provided = req.headers['master-api-key'];
    const expected = process.env.MASTER_API_KEY;
    if (typeof provided !== 'string' || !provided || !expected) return false;

    const providedDigest = crypto.createHash('sha256').update(provided).digest();
    const expectedDigest = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(providedDigest, expectedDigest);
};

export const authenticateWebOrMaster: RequestHandler = catchAsync(async (req, _res, next) => {
    const accessToken = getBearerToken(req.headers.authorization);
    if (accessToken) {
        let user: User | null = null;
        try {
            const jwtUtils = await loadJwtUtils();
            const payload = jwtUtils.verifyAccessToken(accessToken);
            const userId = typeof payload === 'object' && payload !== null ? (payload as AccessPayload).id : undefined;
            if (typeof userId === 'string') {
                user = await User.findByPk(userId);
            }
        } catch {
            user = null;
        }
        if (user) {
            req.actor = { kind: 'web', userId: user.id, role: user.role };
            req.user = { id: user.id, role: user.role };
            return next();
        }
    }

    if (hasValidMasterKey(req)) {
        req.actor = { kind: 'bot' };
        return next();
    }

    return unauthorized(next);
});

export const requireActorRoles =
    (...allowedRoles: number[]): RequestHandler =>
    (req, _res, next) => {
        if (!req.actor) return unauthorized(next);
        if (req.actor.kind === 'bot' || allowedRoles.includes(req.actor.role)) return next();
        return forbidden(next);
    };

export const requireWebActorRoles =
    (...allowedRoles: number[]): RequestHandler =>
    (req, _res, next) => {
        if (!req.actor) return unauthorized(next);
        if (req.actor.kind === 'web' && allowedRoles.includes(req.actor.role)) return next();
        return forbidden(next);
    };

export const requireBotActor: RequestHandler = (req, _res, next) => {
    if (!req.actor) return unauthorized(next);
    if (req.actor.kind === 'bot') return next();
    return forbidden(next);
};
