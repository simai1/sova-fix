import crypto from 'crypto';
import { NextFunction, Request, Response } from 'express';
import catchAsync from '../utils/catchAsync';
import ApiError from '../utils/ApiError';
import httpStatus from 'http-status';
import ApiKey from '../models/apiKey';

const verifyMasterApiKey = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Сравниваем за константное время (sec-audit M-5): обычный `!==`
    // short-circuit'ит на первом несовпадающем байте, и злоумышленник
    // через timing-side-channel может байт-за-байтом восстановить master-key.
    // 401 (а не 400) — чтобы соответствовать смыслу «неавторизован».
    const provided = String(req.headers['master-api-key'] ?? '');
    const expected = String(process.env.MASTER_API_KEY ?? '');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid Master Api Key'));
    }
    return next();
});

const verifyApiKey = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const key = req.headers['api-key'];
    const apiKey = await ApiKey.findOne({ where: { key } }).catch(() =>
        next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid Api Key'))
    );
    if (!apiKey) {
        return next(new ApiError(httpStatus.BAD_REQUEST, 'Invalid Api Key'));
    }
    return next();
});

export default {
    verifyMaster: verifyMasterApiKey,
    verifyApiKey: verifyApiKey,
};
